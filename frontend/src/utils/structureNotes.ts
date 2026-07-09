export interface KnowledgePoint {
  title: string
  content: string
  importance: 'high' | 'medium' | 'low'
}

export interface StructuredNote {
  title: string
  summary: string
  content: string
  knowledgePoints: KnowledgePoint[]
}

const sentenceSeparators = /[。！？!?；;\n]+/

const cleanupLine = (line: string) => {
  return line
    .replace(/^\s*(\d+[:：.、]|\-|\*|•|#+)\s*/, '')
    .replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const unique = (items: string[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (!item || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const getImportance = (text: string): KnowledgePoint['importance'] => {
  if (/重点|核心|必须|关键|考试|结论|定义|原则|公式|步骤/.test(text)) return 'high'
  if (/注意|原因|方法|影响|特点|分类|例子|应用/.test(text)) return 'medium'
  return 'low'
}

const makeTitle = (course: string, fallbackTitle: string, lines: string[]) => {
  if (fallbackTitle.trim()) return fallbackTitle.trim()
  const firstUsefulLine = lines.find((line) => line.length >= 4)
  if (firstUsefulLine) return firstUsefulLine.slice(0, 30)
  return `${course || '未命名资料'} - ${new Date().toLocaleDateString()}`
}

export const structureNoteContent = (input: {
  course: string
  title: string
  rawText: string
  imageCount?: number
}): StructuredNote => {
  const rawLines = input.rawText
    .split(/\r?\n/)
    .map(cleanupLine)
    .filter(Boolean)

  const sentences = unique(
    input.rawText
      .split(sentenceSeparators)
      .map(cleanupLine)
      .filter((line) => line.length >= 6)
  )

  const lines = unique([...rawLines, ...sentences])
  const title = makeTitle(input.course, input.title, lines)
  const rankedLines = [...lines].sort((a, b) => {
    const score = (text: string) => {
      let value = Math.min(text.length, 80)
      if (/重点|核心|定义|结论|步骤|方法|原因|影响|分类|公式/.test(text)) value += 50
      if (/首先|其次|最后|第一|第二|第三/.test(text)) value += 20
      return value
    }
    return score(b) - score(a)
  })

  const summaryItems = rankedLines.slice(0, 4)
  const knowledgePoints = rankedLines.slice(0, 10).map((line, index) => {
    const titleText = line.length > 22 ? `${line.slice(0, 22)}...` : line
    return {
      title: `知识点 ${index + 1}：${titleText}`,
      content: line,
      importance: getImportance(line)
    }
  })

  const summary = summaryItems.length
    ? summaryItems.map((item) => `- ${item}`).join('\n')
    : input.imageCount
      ? `- 已导入 ${input.imageCount} 张图片资料，请在图片说明中补充文字后继续整理。`
      : '- 暂无可整理的文字内容。'

  const organizedText = lines.length
    ? lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
    : '暂无文字纪要。'

  const content = [
    `# ${title}`,
    '',
    `课程：${input.course || '未指定课程'}`,
    `整理时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    '## 一、核心摘要',
    summary,
    '',
    '## 二、知识点清单',
    knowledgePoints.length
      ? knowledgePoints.map((point) => `- **${point.title}**：${point.content}`).join('\n')
      : '- 暂无可提取的知识点。',
    '',
    '## 三、原始内容整理',
    organizedText,
    '',
    '## 四、复习提示',
    '- 先看核心摘要，确认本节课解决了什么问题。',
    '- 再按知识点清单逐条复述，能讲出来才算掌握。',
    '- 如果图片资料里有板书或公式，建议补充文字说明后再次整理。'
  ].join('\n')

  return {
    title,
    summary,
    content,
    knowledgePoints
  }
}
