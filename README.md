# NPI MAP 手机网页版

这是产品查询工具的纯静态手机网页版本，适合放到 GitHub Pages 或公司内部静态网站，手机微信可直接打开链接使用。产品数据使用密码加密，打开页面后需要输入访问密码解锁。

## 功能范围

- 输入访问密码后解锁产品数据。
- 产品搜索：TR、OE、销售号、十位号等关键词。
- 产品族概要：TR、OE、产品类型、代表车型。
- 品牌分组：曼牌、维克斯、璞牌、曼牌金标、电商。
- 显示销售号、状态、十位号、建议图纸名。
- 支持复制建议图纸名。

## 不包含

- 不读取本地图纸。
- 不预览图纸。
- 不写入 `NPI MAP.xlsx`。
- 不依赖 Python 本地服务。

## 本地预览

直接双击 `index.html` 即可打开。

## 发布到 GitHub Pages

把 `mobile-web` 文件夹里的文件上传到 GitHub 仓库，并在仓库设置里开启 Pages。

建议把 `mobile-web` 内容作为 Pages 根目录发布：

```text
index.html
styles.css
app.js
encrypted-data.js
```

## 生成加密数据

当 `tool/npi-map-data.js` 更新后，运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\encrypt_mobile_web_data.ps1
```

按提示输入访问密码。脚本会生成：

```text
mobile-web/encrypted-data.js
```

部署时不要上传 `tool/npi-map-data.js`，只上传 `mobile-web` 里的静态文件。
