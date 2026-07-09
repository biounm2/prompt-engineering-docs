import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const getExtension = (file: File) => {
  return file.name.split('.').pop()?.toLowerCase() || ''
}

export const isReadableDocument = (file: File) => {
  const extension = getExtension(file)
  return ['txt', 'text', 'md', 'markdown', 'docx', 'pdf'].includes(extension) || file.type.startsWith('text/')
}

export const extractTextFromDocument = async (file: File) => {
  const extension = getExtension(file)

  if (['txt', 'text', 'md', 'markdown'].includes(extension) || file.type.startsWith('text/')) {
    return file.text()
  }

  const arrayBuffer = await file.arrayBuffer()

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
  }

  if (extension === 'pdf') {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ')
      pages.push(pageText)
    }

    return pages.join('\n\n').trim()
  }

  return ''
}
