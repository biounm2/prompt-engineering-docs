const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

class DoubaoAPI {
  constructor() {
    this.baseURL = 'https://chat.bytedance.net/api'
    this.apiKey = process.env.DOUBAO_API_KEY || ''
  }

  async speechToText(filePath) {
    try {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))
      formData.append('model', 'whisper')
      formData.append('response_format', 'json')

      const response = await axios.post(`${this.baseURL}/speech/transcriptions`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })

      return response.data.text || response.data.transcription || ''
    } catch (error) {
      console.error('语音转文字失败:', error.message)
      return ''
    }
  }

  async summarize(text) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'doubao-pro',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的课堂笔记总结助手。请对以下课堂笔记内容进行简明扼要的总结，突出重点内容。'
          },
          {
            role: 'user',
            content: `请总结以下课堂笔记：\n\n${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.choices[0].message.content
    } catch (error) {
      console.error('总结失败:', error.message)
      return '无法生成总结，请稍后重试。'
    }
  }

  async extractKnowledgePoints(text) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'doubao-pro',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的知识点提取助手。请从以下课堂笔记中提取关键知识点，每个知识点包含标题、详细内容和重要程度（high/medium/low）。请以JSON格式返回，格式为：[{"title":"知识点标题","content":"知识点内容","importance":"high"}]'
          },
          {
            role: 'user',
            content: `请从以下课堂笔记中提取知识点：\n\n${text}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      const content = response.data.choices[0].message.content
      try {
        const jsonMatch = content.match(/\[.*\]/s)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        return []
      } catch {
        return []
      }
    } catch (error) {
      console.error('知识点提取失败:', error.message)
      return []
    }
  }

  async generateQuestions(text, count = 5) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'doubao-pro',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的出题助手。请根据以下课堂笔记内容生成练习题。题型包括：单选题、多选题、判断题、填空题、简答题。请以JSON格式返回，格式为：[{"type":"single","question":"题目内容","options":["选项A","选项B","选项C","选项D"],"answer":"正确答案","analysis":"解析"}]。type取值：single(单选), multiple(多选), judge(判断), fill(填空), short(简答)'
          },
          {
            role: 'user',
            content: `请根据以下课堂笔记生成${count}道练习题：\n\n${text}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.6
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      const content = response.data.choices[0].message.content
      try {
        const jsonMatch = content.match(/\[.*\]/s)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        return []
      } catch {
        return []
      }
    } catch (error) {
      console.error('出题失败:', error.message)
      return []
    }
  }
}

module.exports = new DoubaoAPI()