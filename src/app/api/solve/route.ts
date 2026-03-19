import { NextResponse } from "next/server";

export const runtime = "nodejs";

let CubeModule: any = null;
let solverReady = false;

function parseSolutionString(solutionString: string): string[] {
  if (!solutionString) return [];
  return solutionString.trim().split(/\s+/).filter(Boolean);
}

function countFaces(stateString: string) {
  const counts: Record<string, number> = {
    U: 0,
    R: 0,
    F: 0,
    D: 0,
    L: 0,
    B: 0,
  };

  for (const ch of stateString) {
    if (counts[ch] !== undefined) {
      counts[ch] += 1;
    }
  }

  return counts;
}

async function getCube() {
  if (CubeModule) return CubeModule;

  try {
    const mod = await import("cubejs");
    CubeModule = mod.default || mod;
    return CubeModule;
  } catch (error) {
    console.error("加载 cubejs 失败：", error);
    throw new Error("cubejs 加载失败，请先执行 npm install cubejs");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stateString = body?.stateString;

    console.log("收到 stateString:", stateString);

    if (!stateString || typeof stateString !== "string") {
      return NextResponse.json(
        { error: "缺少合法的魔方状态字符串。" },
        { status: 400 }
      );
    }

    if (stateString.length !== 54) {
      return NextResponse.json(
        {
          error: `状态字符串长度错误：当前为 ${stateString.length}，正确应为 54。`,
        },
        { status: 400 }
      );
    }

    const counts = countFaces(stateString);
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      if (counts[face] !== 9) {
        return NextResponse.json(
          {
            error: `状态字符串错误：${face} 面数量为 ${counts[face]}，正确应为 9。`,
          },
          { status: 400 }
        );
      }
    }

    const Cube = await getCube();

    if (!solverReady) {
      console.log("开始初始化求解器...");
      Cube.initSolver();
      solverReady = true;
      console.log("求解器初始化完成");
    }

    console.log("开始创建魔方对象...");
    const cube = Cube.fromString(stateString);

    console.log("开始求解...");
    const solution = cube.solve();

    console.log("求解结果:", solution);

    return NextResponse.json({
      solution,
      moves: parseSolutionString(solution),
    });
  } catch (error: any) {
    console.error("求解接口报错:", error);

    return NextResponse.json(
      {
        error: error?.message || "求解失败，请检查当前魔方状态是否合法。",
      },
      { status: 500 }
    );
  }
}