# 手机网页版部署说明

## 方式一：GitHub Pages

适合长期维护，有固定链接。

1. 打开 <https://github.com/new>。
2. 新建仓库，例如 `npi-map-mobile`。
3. 不要选择模板，创建空仓库即可。
4. 先运行 `scripts\encrypt_mobile_web_data.ps1` 生成加密数据。
5. 解压新的部署包。
6. 在 GitHub 仓库页面点击 `uploading an existing file`。
7. 上传解压后的核心文件：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `encrypted-data.js`
   - `README.md`
8. 进入仓库 `Settings` -> `Pages`。
9. Source 选择 `Deploy from a branch`。
10. Branch 选择 `main`，目录选择 `/root`，保存。
11. 等待 1-2 分钟，GitHub 会生成网页链接。

## 方式二：Netlify Drop

适合最快预览。

1. 打开 <https://app.netlify.com/drop>。
2. 把 `dist/npi-map-mobile-web-github-pages.zip` 拖进去。
3. 等待生成网页链接。

## 数据安全

不要上传 `npi-map-data.js`。公开仓库中只应出现 `encrypted-data.js`。

如果你已经把明文 `npi-map-data.js` 上传到公开 GitHub 仓库，建议删除该仓库后重新建仓库，因为提交历史里仍可能保留明文数据。
