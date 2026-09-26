// 仅解析四则运算，不执行输入中的 JavaScript。
export function evaluateArithmetic(input: string): number | null {
  const source = input.trim();
  if (!source || !/^[\d\s.+\-*/()]+$/.test(source)) return null;
  const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[^\s]/g) || [];
  let index = 0;
  const factor = (): number => {
    const token = tokens[index++];
    if (token === "+") return factor();
    if (token === "-") return -factor();
    if (token === "(") {
      const value = expression();
      if (tokens[index++] !== ")") throw new Error("括号不匹配");
      return value;
    }
    if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error("公式不完整");
    return Number(token);
  };
  const term = (): number => {
    let value = factor();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const operator = tokens[index++];
      const right = factor();
      if (operator === "/" && right === 0) throw new Error("不能除以零");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  const expression = (): number => {
    let value = term();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  try {
    const value = expression();
    return index === tokens.length && Number.isFinite(value) ? Number(value.toPrecision(15)) : null;
  } catch {
    return null;
  }
}
