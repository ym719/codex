import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: Page) {
  await page.goto('/');
  await expect(page.locator('.artwork-card')).toHaveCount(6);
}
async function nav(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: '主导航' })
    .getByRole('button', { name, exact: true })
    .click();
}
async function loadGalleryImages(page: Page) {
  for (const image of await page.locator('.artwork-frame img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

test('day and night themes persist and every studio page fits the viewport', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await loadGalleryImages(page);
  expect(
    await page.locator('.daily-note>div').evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThan(200);
  await page.screenshot({
    path: testInfo.outputPath('studio-day.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换到夜间主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expect(page.locator('.hero-painting img')).toHaveAttribute('src', /moonlit-garden/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await loadGalleryImages(page);
  await page.screenshot({
    path: testInfo.outputPath('studio-night.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const name of ['我的策展', '创作档案', '色彩实验室', '灵感手记']) {
    await nav(page, name);
    await expect(page.locator('.page-heading h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      name,
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`night-${name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.getByRole('button', { name: '切换到白天主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await nav(page, '色彩实验室');
  await page.screenshot({
    path: testInfo.outputPath('color-lab-day.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(errors).toEqual([]);
});

test('favorites survive reload and are available as a curated collection', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '加入心选：缓慢的潮汐', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '取消心选：缓慢的潮汐', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: '只看心选', exact: true }).click();
  await expect(page.locator('.artwork-card')).toHaveCount(1);
  await nav(page, '我的策展');
  await page.locator('.favorite-collection').click();
  await expect(page.locator('.artwork-card')).toHaveCount(1);
  await page.getByRole('button', { name: '取消心选：缓慢的潮汐', exact: true }).click();
  await expect(page.getByText('把偏爱的作品，留在这里。')).toBeVisible();
  await page.getByRole('button', { name: '查看全部作品', exact: true }).click();
  await expect(page.locator('.artwork-card')).toHaveCount(6);
});

test('create a series, browse it, and remove the group without deleting artwork', async ({
  page,
}) => {
  await open(page);
  await nav(page, '我的策展');
  await page.getByRole('button', { name: '创建策展系列', exact: true }).click();
  await page.getByLabel('系列名称', { exact: true }).fill('我的光影展');
  await page.getByRole('checkbox', { name: /缓慢的潮汐/ }).check();
  await page.getByRole('checkbox', { name: /光经过的地方/ }).check();
  await page.getByRole('button', { name: '保存系列', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '打开系列：我的光影展', exact: true }).click();
  await expect(page.locator('.artwork-card')).toHaveCount(2);
  await page.reload();
  await nav(page, '我的策展');
  await page.getByRole('button', { name: '移除系列：我的光影展', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('所有作品及图片都会保留');
  await page.getByRole('button', { name: '确认移除', exact: true }).click();
  await expect(page.getByRole('button', { name: '打开系列：我的光影展', exact: true })).toHaveCount(
    0,
  );
  await nav(page, '艺术空间');
  await expect(page.locator('.artwork-card')).toHaveCount(6);
});

test('color palette interactions create editable persistent journal entries', async ({ page }) => {
  await open(page);
  await nav(page, '色彩实验室');
  await expect(page.locator('.palette-card')).toHaveCount(6);
  await page.getByRole('button', { name: '野兽派灵感', exact: true }).click();
  await expect(page.locator('.palette-card')).toHaveCount(2);
  await page.getByRole('button', { name: '复制色值 #C34534', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('#C34534');
  await page.getByRole('button', { name: '用野兽派的午后写手记', exact: true }).click();
  await page.getByLabel('手记标题').fill('今天的大胆颜色');
  await page.getByLabel('灵感内容').fill('用群青与朱红描绘窗台。');
  await page.getByRole('button', { name: '保存手记', exact: true }).click();
  await expect(page.locator('.journal-card')).toHaveCount(1);
  await expect(page.locator('.note-palette span')).toHaveCount(5);
  await page.reload();
  await nav(page, '灵感手记');
  await expect(page.locator('.journal-card')).toContainText('用群青与朱红描绘窗台。');
  await page.getByRole('button', { name: '继续书写', exact: true }).click();
  await page.getByLabel('手记标题').fill('修改后的灵感');
  await page.getByRole('button', { name: '保存手记', exact: true }).click();
  await page.getByRole('button', { name: '删除手记：修改后的灵感', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page.locator('.journal-card')).toHaveCount(1);
  await page.getByRole('button', { name: '删除手记：修改后的灵感', exact: true }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.locator('.journal-card')).toHaveCount(0);
  await page.reload();
  await nav(page, '灵感手记');
  await expect(page.locator('.journal-card')).toHaveCount(0);
});

test('immersive exhibition supports keyboard navigation and optional playback', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: '沉浸看展', exact: true }).click();
  await expect(page.locator('.exhibition-modal')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', '缓慢的潮汐');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', '光经过的地方');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', '缓慢的潮汐');
  await page.getByRole('button', { name: '自动播放', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', '光经过的地方', {
    timeout: 8000,
  });
  await page.getByRole('button', { name: '暂停自动播放', exact: true }).click();
  await page.getByRole('button', { name: '退出沉浸看展', exact: true }).click();
  await expect(page.locator('.exhibition-modal')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '编辑作品', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('full backup includes journals and metadata and restores them together', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '加入心选：缓慢的潮汐', exact: true }).click();
  await nav(page, '灵感手记');
  await page.getByRole('button', { name: '写一则手记', exact: true }).click();
  await page.getByLabel('手记标题').fill('备份测试');
  await page.getByLabel('灵感内容').fill('这则手记应该随作品一起恢复。');
  await page.getByRole('button', { name: '保存手记', exact: true }).click();
  await page.getByRole('button', { name: '作品仅保存在此浏览器' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出完整备份', exact: true }).click();
  const download = await downloading;
  const content = await readFile((await download.path())!);
  const backup = JSON.parse(content.toString());
  expect(backup.version).toBe(2);
  expect(backup.journals[0].title).toBe('备份测试');
  expect(backup.artworks.find((a: { id: string }) => a.id === 'sample-0')).toMatchObject({
    favorite: true,
    series: '风景里的光',
  });
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '删除手记：备份测试', exact: true }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await page.getByRole('button', { name: '作品仅保存在此浏览器' }).click();
  await page
    .getByLabel('导入备份文件')
    .setInputFiles({ name: 'archive.json', mimeType: 'application/json', buffer: content });
  await expect(page.getByRole('dialog')).toContainText('1 则手记替换当前 0 则手记');
  await page.getByRole('button', { name: '确认恢复', exact: true }).click();
  await expect(page.locator('.journal-card')).toContainText('这则手记应该随作品一起恢复。');
  await page.reload();
  await nav(page, '艺术空间');
  await expect(
    page.getByRole('button', { name: '取消心选：缓慢的潮汐', exact: true }),
  ).toBeVisible();
});

test('opening an existing version 1 IndexedDB keeps personal images and metadata intact', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.artwork-card')).toHaveCount(6);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('art-archive', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['artworks', 'settings'], 'readwrite');
        const store = tx.objectStore('artworks');
        store.clear();
        store.put({
          id: 'legacy-personal',
          title: '旧版中的我的作品',
          date: '2025-07-08',
          category: '绘画',
          medium: '油画',
          notes: '不要丢失这个记录',
          image: new Blob(
            [
              '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>',
            ],
            { type: 'image/svg+xml' },
          ),
          width: 20,
          height: 20,
          createdAt: 1,
          updatedAt: 1,
          isDemo: false,
        });
        tx.objectStore('settings').put(true, 'initialized');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  await page.reload();
  await expect(page.locator('.artwork-card')).toHaveCount(1);
  await page.getByRole('button', { name: '查看作品：旧版中的我的作品', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('不要丢失这个记录');
  await expect(page.getByRole('dialog').locator('img')).toHaveJSProperty('naturalWidth', 20);
  await page.getByRole('button', { name: '加入心选', exact: true }).click();
  await expect(page.getByRole('button', { name: '取消心选', exact: true })).toBeVisible();
});
