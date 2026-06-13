'use client'

import { useState, useRef, ChangeEvent } from 'react'

type Question = {
  q: string
  options: string[]
  answer: number
  explanation: string
}

type Screen = 'input' | 'loading' | 'quiz' | 'result'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('input')
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image')
  const [imageBase64, setImageBase64] = useState('')
  const [imageType, setImageType] = useState('image/jpeg')
  const [imagePreview, setImagePreview] = useState('')
  const [textContent, setTextContent] = useState('')
  const [count, setCount] = useState('5')
  const [difficulty, setDifficulty] = useState('medium')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<{ correct: boolean; answer: string; q: string }[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('分析しています…')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setImagePreview(dataUrl)
      setImageBase64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  async function generate() {
    if (inputMode === 'image' && !imageBase64) return
    if (inputMode === 'text' && textContent.length < 50) return

    setError('')
    setScreen('loading')

    const msgs = ['教科書を読み込んでいます…', '重要ポイントを抽出中…', '問題を作成しています…', 'もう少しで完成です…']
    let i = 0
    setLoadingMsg(msgs[0])
    const lt = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]) }, 1800)

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: inputMode === 'image' ? imageBase64 : null,
          imageType,
          textContent: inputMode === 'text' ? textContent : null,
          count,
          difficulty,
        }),
      })

      clearInterval(lt)

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'エラーが発生しました')
      if (!data.questions?.length) throw new Error('問題が生成されませんでした')

      setQuestions(data.questions)
      setCurrent(0)
      setScore(0)
      setAnswers([])
      setSelected(null)
      setScreen('quiz')
    } catch (err: unknown) {
      clearInterval(lt)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setScreen('input')
    }
  }

  function selectAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const q = questions[current]
    const correct = idx === q.answer
    if (correct) setScore((s) => s + 1)
    setAnswers((a) => [...a, { correct, answer: q.options[q.answer], q: q.q }])
  }

  function next() {
    if (current + 1 >= questions.length) {
      setScreen('result')
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  function retry() {
    setCurrent(0)
    setScore(0)
    setAnswers([])
    setSelected(null)
    setQuestions((qs) => [...qs].sort(() => Math.random() - 0.5))
    setScreen('quiz')
  }

  function goHome() {
    setScreen('input')
    setImageBase64('')
    setImagePreview('')
    setTextContent('')
    setQuestions([])
    setSelected(null)
    setError('')
  }

  const q = questions[current]
  const total = questions.length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <main className="min-h-screen bg-[#f8f7f4] flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">教科書クイズ</h1>
          <p className="text-sm text-[#888] mt-0.5">写真かテキストから問題を自動生成</p>
        </div>

        {/* 入力画面 */}
        {screen === 'input' && (
          <div>
            {/* タブ切り替え */}
            <div className="flex gap-1 mb-4 bg-white border border-[#e8e5e0] rounded-xl p-1">
              {(['image', 'text'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 py-2 text-sm rounded-lg transition-all font-medium ${
                    inputMode === mode
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#888] hover:text-[#1a1a1a]'
                  }`}
                >
                  {mode === 'image' ? '📷 写真' : '📝 テキスト'}
                </button>
              ))}
            </div>

            {/* 写真入力 */}
            {inputMode === 'image' && (
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                {!imagePreview ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#d4d0c8] rounded-2xl p-10 text-center hover:border-[#aaa] hover:bg-white transition-all"
                  >
                    <div className="text-4xl mb-2">📸</div>
                    <p className="font-medium text-[#1a1a1a]">写真をアップロード</p>
                    <p className="text-sm text-[#888] mt-1">タップして撮影・選択</p>
                  </button>
                ) : (
                  <div>
                    <img src={imagePreview} alt="プレビュー" className="w-full max-h-52 object-contain rounded-xl border border-[#e8e5e0] bg-white mb-3" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-sm text-[#888] underline underline-offset-2"
                    >
                      別の写真を選ぶ
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* テキスト入力 */}
            {inputMode === 'text' && (
              <div>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  placeholder={'教科書の内容をここに貼り付けてください\n\n例：光合成とは、植物が光エネルギーを使って二酸化炭素と水からブドウ糖を作り出す反応である…'}
                  className="w-full bg-white border border-[#e8e5e0] rounded-xl p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#aaa] placeholder:text-[#bbb]"
                />
                <p className={`text-xs text-right mt-1 ${textContent.length < 50 && textContent.length > 0 ? 'text-red-400' : 'text-[#aaa]'}`}>
                  {textContent.length} 文字{textContent.length > 0 && textContent.length < 50 ? '（50文字以上必要）' : ''}
                </p>
              </div>
            )}

            {/* オプション */}
            <div className="flex gap-3 items-center mt-4 mb-4">
              <div className="flex-1">
                <label className="text-xs text-[#888] block mb-1">問題数</label>
                <select
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full bg-white border border-[#e8e5e0] rounded-lg px-3 h-9 text-sm outline-none"
                >
                  <option value="3">3問</option>
                  <option value="5">5問</option>
                  <option value="8">8問</option>
                  <option value="10">10問</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#888] block mb-1">難易度</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-[#e8e5e0] rounded-lg px-3 h-9 text-sm outline-none"
                >
                  <option value="easy">やさしい</option>
                  <option value="medium">ふつう</option>
                  <option value="hard">むずかしい</option>
                </select>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={inputMode === 'image' ? !imageBase64 : textContent.length < 50}
              className="w-full h-11 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              ✨ 問題を生成する
            </button>

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {/* ローディング画面 */}
        {screen === 'loading' && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-[#e8e5e0] border-t-[#1a1a1a] rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium text-[#1a1a1a]">{loadingMsg}</p>
            <p className="text-sm text-[#888] mt-1">少々お待ちください</p>
          </div>
        )}

        {/* クイズ画面 */}
        {screen === 'quiz' && q && (
          <div>
            {/* 進捗 */}
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-[#888]">問題 {current + 1} / {total}</span>
              <span className="font-medium">{score}点</span>
            </div>
            <div className="h-1 bg-[#e8e5e0] rounded-full mb-5">
              <div
                className="h-full bg-[#1a1a1a] rounded-full transition-all duration-300"
                style={{ width: `${((current) / total) * 100}%` }}
              />
            </div>

            {/* 問題 */}
            <div className="bg-white border border-[#e8e5e0] rounded-2xl p-5 mb-3">
              <p className="text-base font-medium leading-relaxed mb-4">{q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  let style = 'bg-[#f8f7f4] border-[#e8e5e0] text-[#1a1a1a] hover:border-[#aaa]'
                  if (selected !== null) {
                    if (i === q.answer) style = 'bg-[#EAF3DE] border-[#639922] text-[#3B6D11]'
                    else if (i === selected) style = 'bg-[#FCEBEB] border-[#E24B4A] text-[#A32D2D]'
                    else style = 'bg-[#f8f7f4] border-[#e8e5e0] text-[#aaa]'
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm flex items-center gap-3 transition-all ${style}`}
                    >
                      <span className="text-xs opacity-60 min-w-[16px]">{['A','B','C','D'][i]}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>

              {selected !== null && (
                <div className="mt-3 bg-[#f8f7f4] rounded-xl p-3 text-sm text-[#555] leading-relaxed border-l-2 border-[#d4d0c8]">
                  {q.explanation}
                </div>
              )}
            </div>

            {selected !== null && (
              <button
                onClick={next}
                className="w-full h-11 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {current + 1 >= total ? '🏆 結果を見る' : '次の問題へ →'}
              </button>
            )}
          </div>
        )}

        {/* 結果画面 */}
        {screen === 'result' && (
          <div>
            <div className="bg-white border border-[#e8e5e0] rounded-2xl p-6 text-center mb-4">
              <div className="text-5xl font-semibold mb-1">{pct}%</div>
              <p className="text-sm text-[#888]">{total}問中 {score}問正解</p>
              <p className="text-sm mt-2">
                {pct >= 80 ? '素晴らしい！よく理解できています🎉' : pct >= 60 ? 'もう少し！復習すれば伸びます' : '基礎から見直してみましょう'}
              </p>
              <div className="flex gap-2 justify-center mt-5">
                <button onClick={retry} className="h-9 px-4 bg-[#f8f7f4] border border-[#e8e5e0] rounded-lg text-sm hover:bg-[#f0ede8] transition-colors">
                  もう一度
                </button>
                <button onClick={goHome} className="h-9 px-4 bg-[#1a1a1a] text-white rounded-lg text-sm hover:opacity-90 transition-opacity">
                  別の教科書で作る
                </button>
              </div>
            </div>

            {/* 振り返り */}
            <p className="text-xs text-[#aaa] mb-2">— 振り返り —</p>
            {answers.map((a, i) => (
              <div key={i} className="bg-white border border-[#e8e5e0] rounded-xl px-4 py-3 mb-2">
                <p className="text-sm font-medium">
                  <span className={`mr-2 ${a.correct ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}`}>
                    {a.correct ? '✓' : '✗'}
                  </span>
                  {a.q}
                </p>
                {!a.correct && <p className="text-xs text-[#888] mt-1">正解: {a.answer}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
