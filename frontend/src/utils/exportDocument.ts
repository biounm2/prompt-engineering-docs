const toSafeFileName = (title: string) => {
  return (title || '结构化文档')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const downloadMarkdown = (title: string, content: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${toSafeFileName(title)}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const openPrintablePdf = (title: string, content: string) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('浏览器阻止了弹窗，请允许弹窗后重试。')
    return
  }

  printWindow.document.write(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title || '结构化文档')}</title>
  <style>
    @page { margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      color: #1f2937;
      line-height: 1.75;
      white-space: pre-wrap;
    }
    h1 { font-size: 24px; margin-bottom: 20px; }
    pre { white-space: pre-wrap; word-break: break-word; font-family: inherit; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title || '结构化文档')}</h1>
  <pre>${escapeHtml(content)}</pre>
  <script>
    window.onload = () => {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`)
  printWindow.document.close()
}
