import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, imageType, textContent, count, difficulty } = body

    if (!imageBase64 && !textContent) {
      return NextResponse.json({ error: '画像またはテキストが必要です' }, { status: 400 })
    }

    const diffLabel: Record<string, string> = {
      easy: 'やさしい（基本用語・重要ワードを問う）',
      medium: 'ふつう（内容の理解を問う）',
      hard: 'むずかしい（応用・深い理解が必要）',
    }

    const apiKey = process.env.GOOGLE_API_KEY
    const model = 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const parts: object[] = []

    if (imageBase64) {
      const mimeType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(imageType)
        ? imageType
        : 'image/jpeg'
      parts.push({ inlineData: { mimeType, data: imageBase64 } })
      parts.push({ text: `この教科書の画像から${count}問の4択問題を作成してください。難易度: ${diffLabel[difficulty]}` })
    } else {
      parts.push({
        text: `以下の教科書の内容から${count}問の4択問題を作成してください。難易度: ${diffLabel[difficulty]}\n\n---\n${textContent}\n---`
      })
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `あなたは教育クイズ生成AIです。与えられた教科書の内容をもとに4択問題を生成してください。
テキストに書かれていないことは問わないでください。
必ずJSONのみで返答してください。Markdownのコードブロックや前置きは不要です。
形式:
{"questions":[{"q":"問題文","options":["A","B","C","D"],"answer":0,"explanation":"解説"}]}
answerは正解のインデックス(0〜3)。`
          }]
        },
        contents: [{ parts }]
      })
    })

    if (!res.ok) {
      const e = await res.json()
      throw new Error(`Google API エラー: ${JSON.stringify(e)}`)
    }

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : '不明なエラー'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
