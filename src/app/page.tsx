"use client";

import { useMemo, useState } from "react";

type FaceKey = "U" | "R" | "F" | "D" | "L" | "B";

type FaceState = Record<FaceKey, string[]>;

const FACE_ORDER: FaceKey[] = ["U", "R", "F", "D", "L", "B"];
const COLOR_ORDER: FaceKey[] = ["U", "R", "F", "D", "L", "B"];

const FACE_LABELS: Record<FaceKey, string> = {
  U: "上",
  R: "右",
  F: "前",
  D: "下",
  L: "左",
  B: "后",
};

const FACE_COLORS: Record<FaceKey, string> = {
  U: "#ffffff",
  R: "#ef4444",
  F: "#22c55e",
  D: "#facc15",
  L: "#f97316",
  B: "#3b82f6",
};

function createSolvedCube(): FaceState {
  return {
    U: Array(9).fill("U"),
    R: Array(9).fill("R"),
    F: Array(9).fill("F"),
    D: Array(9).fill("D"),
    L: Array(9).fill("L"),
    B: Array(9).fill("B"),
  };
}

function getTextColor(face: FaceKey) {
  return face === "U" ? "#111827" : "#ffffff";
}

function countFaces(stateString: string) {
  const counts: Record<FaceKey, number> = {
    U: 0,
    R: 0,
    F: 0,
    D: 0,
    L: 0,
    B: 0,
  };

  for (const ch of stateString) {
    if (ch in counts) {
      counts[ch as FaceKey] += 1;
    }
  }

  return counts;
}

export default function Page() {
  const [cube, setCube] = useState<FaceState>(createSolvedCube());
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [statePreview, setStatePreview] = useState<string>("");

  const stateString = useMemo(() => {
    return FACE_ORDER.map((face) => cube[face].join("")).join("");
  }, [cube]);

  function handleTileClick(face: FaceKey, index: number) {
    if (index === 4) return;

    setCube((prev) => {
      const current = prev[face][index] as FaceKey;
      const currentIndex = COLOR_ORDER.indexOf(current);
      const nextColor = COLOR_ORDER[(currentIndex + 1) % COLOR_ORDER.length];

      const nextFace = [...prev[face]];
      nextFace[index] = nextColor;

      return {
        ...prev,
        [face]: nextFace,
      };
    });

    setSolution("");
    setError("");
  }

  function resetCube() {
    setCube(createSolvedCube());
    setSolution("");
    setError("");
    setStatePreview("");
  }

  async function solveCube() {
    try {
      setLoading(true);
      setError("");
      setSolution("");

      const currentStateString = FACE_ORDER.map((face) => cube[face].join("")).join("");
      setStatePreview(currentStateString);

      const counts = countFaces(currentStateString);

      if (currentStateString.length !== 54) {
        setError(`状态字符串长度错误：当前为 ${currentStateString.length}，正确应为 54。`);
        return;
      }

      for (const face of FACE_ORDER) {
        if (counts[face] !== 9) {
          setError(`${FACE_LABELS[face]}面（${face}）颜色数量错误：当前为 ${counts[face]}，正确应为 9。`);
          return;
        }
      }

      const res = await fetch("/api/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stateString: currentStateString,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "求解失败");
        return;
      }

      setSolution(data.solution || "已求解，但没有返回步骤");
    } catch (err: any) {
      setError(err?.message || "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-center text-3xl font-bold">3×3 魔方求解器</h1>
        <p className="mb-8 text-center text-sm text-slate-600">
          点击色块切换颜色，中心块固定不变。填写完成后点击“求解”。
        </p>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {FACE_ORDER.map((face) => (
                <div key={face} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {FACE_LABELS[face]}面 ({face})
                    </h2>
                    <span className="text-xs text-slate-500">中间不可改</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {cube[face].map((tile, index) => {
                      const tileFace = tile as FaceKey;
                      const isCenter = index === 4;

                      return (
                        <button
                          key={`${face}-${index}`}
                          type="button"
                          onClick={() => handleTileClick(face, index)}
                          disabled={isCenter}
                          className={`flex h-16 w-16 items-center justify-center rounded-xl border text-lg font-bold transition ${
                            isCenter
                              ? "cursor-not-allowed border-slate-400 ring-2 ring-slate-400"
                              : "cursor-pointer border-slate-300 hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: FACE_COLORS[tileFace],
                            color: getTextColor(tileFace),
                          }}
                        >
                          {tile}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">操作区</h2>

            <div className="mb-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={solveCube}
                disabled={loading}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "求解中..." : "开始求解"}
              </button>

              <button
                type="button"
                onClick={resetCube}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                恢复已还原状态
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">当前状态字符串</h3>
              <p className="break-all font-mono text-xs text-slate-600">{stateString}</p>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">颜色统计</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                {Object.entries(countFaces(stateString)).map(([face, count]) => (
                  <div key={face} className="rounded-lg bg-white px-3 py-2">
                    {face}: {count}
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-red-700">报错信息</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : null}

            {solution ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-green-700">求解结果</h3>
                <p className="break-words font-mono text-sm text-green-700">{solution}</p>
              </div>
            ) : null}

            {statePreview ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">最近一次提交给后端的状态</h3>
                <p className="break-all font-mono text-xs text-slate-600">{statePreview}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}