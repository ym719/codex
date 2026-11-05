import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
const cards = (page: Page) => page.locator('.artwork-card');
async function open(page: Page) {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(6);
  await expect(page.getByText('正在打开你的艺术档案…')).toHaveCount(0);
}
async function about(page: Page) {
  await page.getByRole('button', { name: '作品仅保存在此浏览器' }).click();
}
async function add(page: Page, title = '我的第一件作品') {
  await page.getByRole('button', { name: '添加作品', exact: true }).click();
  await page
    .getByLabel('上传图片文件')
    .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('button', { name: '收藏作品', exact: true })).toBeEnabled();
  await page.getByLabel('作品名称').fill(title);
  await page.getByLabel('创作日期').fill('2026-10-20');
  await page.getByLabel('作品类别').selectOption('摄影');
  await page.getByLabel('创作媒介').fill('数码摄影');
  await page.getByLabel('创作笔记').fill('午后的阳光，留在这里。');
  await page.getByRole('button', { name: '收藏作品', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('gallery, filters, search, sorting and chronological archive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.getByRole('heading', { name: '缓慢的潮汐', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '摄影 2', exact: true }).click();
  await expect(cards(page)).toHaveCount(2);
  await page.getByRole('button', { name: '全部作品 6', exact: true }).click();
  await page.getByRole('button', { name: '搜索作品', exact: true }).click();
  await page.getByLabel('搜索作品名称、媒介或笔记').fill('铅笔');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('日常的轮廓');
  await page.getByLabel('搜索作品名称、媒介或笔记').fill('找不到这件作品');
  await expect(page.getByText('还没有找到这件作品。')).toBeVisible();
  await page.getByRole('button', { name: '关闭搜索', exact: true }).click();
  await page.getByLabel('作品排序').selectOption('oldest');
  await expect(cards(page).first()).toContainText('一座小小的花园');
  await page.getByRole('button', { name: '列表视图', exact: true }).click();
  await expect(page.locator('.list-layout')).toBeVisible();
  await page.getByRole('button', { name: '创作档案', exact: true }).click();
  await expect(page.locator('.timeline-group')).toHaveCount(3);
  await expect(page.locator('.timeline-group').first()).toContainText('6 月');
  await expect(page.locator('.timeline-card')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('upload, reload, edit, delete cancellation and confirmed deletion', async ({ page }) => {
  await open(page);
  await add(page);
  await expect(cards(page)).toHaveCount(7);
  await page.reload();
  await page.getByRole('button', { name: '查看作品：我的第一件作品', exact: true }).click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByText('午后的阳光，留在这里。')).toBeVisible();
  await expect(detail.locator('img')).toHaveJSProperty('naturalWidth', 1);
  await page.getByRole('button', { name: '编辑作品', exact: true }).click();
  await page.getByLabel('作品名称').fill('更新后的作品');
  await page.getByLabel('作品类别').selectOption('速写');
  await page.getByLabel('创作日期').fill('2024-01-02');
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '查看作品：更新后的作品', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('2024.01.02');
  await expect(page.getByRole('dialog').locator('.eyebrow')).toContainText('速写');
  await page.getByRole('button', { name: '删除作品', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(cards(page)).toHaveCount(7);
  await page.getByRole('button', { name: '查看作品：更新后的作品', exact: true }).click();
  await page.getByRole('button', { name: '删除作品', exact: true }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(cards(page)).toHaveCount(6);
  await page.reload();
  await expect(cards(page)).toHaveCount(6);
  await expect(
    page.getByRole('button', { name: '查看作品：更新后的作品', exact: true }),
  ).toHaveCount(0);
});

test('clear only examples and preserve personal work across reload', async ({ page }) => {
  await open(page);
  await add(page);
  await page.getByRole('button', { name: '清空示例', exact: true }).click();
  await page.getByRole('button', { name: '确认清空示例', exact: true }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('我的第一件作品');
  await page.reload();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole('button', { name: '摄影 1', exact: true })).toBeVisible();
});

test('export and restore a backup, and retain intentionally empty collections', async ({
  page,
}) => {
  await open(page);
  await about(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出完整备份', exact: true }).click();
  const download = await downloadPromise;
  const data = await readFile((await download.path())!);
  const json = JSON.parse(data.toString());
  expect(json.artworks).toHaveLength(6);
  expect(json.artworks[0].image).toMatch(/^data:image\//);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '清空示例', exact: true }).click();
  await page.getByRole('button', { name: '确认清空示例', exact: true }).click();
  await expect(page.getByText('你的故事，从第一件作品开始。')).toBeVisible();
  await page.reload();
  await expect(page.getByText('你的故事，从第一件作品开始。')).toBeVisible();
  await about(page);
  await page
    .getByLabel('导入备份文件')
    .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: data });
  await expect(page.getByRole('dialog')).toContainText('6 件作品将替换当前 0 件作品');
  await page.getByRole('button', { name: '确认恢复', exact: true }).click();
  await expect(cards(page)).toHaveCount(6);
  await page.reload();
  await expect(cards(page)).toHaveCount(6);
});

test('reject invalid image and corrupt backup while keeping the library', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '添加作品', exact: true }).click();
  await page
    .getByLabel('上传图片文件')
    .setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.getByRole('alert')).toContainText('请选择 JPG');
  await page.getByLabel('上传图片文件').setInputFiles({
    name: 'corrupt.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not an image'),
  });
  await expect(page.getByRole('alert')).toContainText('无法读取这张图片');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await about(page);
  await page.getByLabel('导入备份文件').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{bad}'),
  });
  await expect(page.getByRole('alert')).toContainText('不是有效的');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(cards(page)).toHaveCount(6);
});

test('responsive layout, loaded artwork images and keyboard dialogs', async ({
  page,
}, testInfo) => {
  await open(page);
  for (const image of await page.locator('.artwork-frame img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect
    .poll(() =>
      page
        .locator('.artwork-frame img')
        .evaluateAll((imgs) =>
          imgs.every(
            (img) =>
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: testInfo.outputPath('gallery.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '查看作品：缓慢的潮汐', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('detail.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '添加作品', exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath('upload.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
