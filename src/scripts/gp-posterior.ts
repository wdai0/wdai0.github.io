import {
  clamp,
  describeKernel,
  gpPosterior,
  linspace
} from "./gp-math";
import type { KernelName, KernelParams } from "./gp-math";

type Point = { x: number; y: number };

const PLOT_WIDTH = 720;
const PLOT_HEIGHT = 360;
const PADDING = 34;
const X_MIN = -4;
const X_MAX = 4;
const Y_MIN = -3;
const Y_MAX = 3;

function getRoot(): HTMLElement | null {
  return document.querySelector("#gp-posterior-explorer");
}

function renderValue(output: HTMLOutputElement, value: number): void {
  output.value = value.toFixed(2);
  output.textContent = value.toFixed(2);
}

function dataToSvgX(value: number): number {
  return PADDING + ((value - X_MIN) / (X_MAX - X_MIN)) * (PLOT_WIDTH - PADDING * 2);
}

function dataToSvgY(value: number): number {
  return PLOT_HEIGHT - PADDING - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * (PLOT_HEIGHT - PADDING * 2);
}

function svgToData(svg: SVGSVGElement, event: MouseEvent): Point {
  const bounds = svg.getBoundingClientRect();
  const relativeX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
  const relativeY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);

  return {
    x: X_MIN + relativeX * (X_MAX - X_MIN),
    y: Y_MAX - relativeY * (Y_MAX - Y_MIN)
  };
}

function linePath(xs: number[], ys: number[]): string {
  return xs
    .map((xValue, index) => {
      const x = dataToSvgX(xValue);
      const y = dataToSvgY(ys[index]);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPath(xs: number[], lower: number[], upper: number[]): string {
  const top = xs
    .map((xValue, index) => `${index === 0 ? "M" : "L"} ${dataToSvgX(xValue)} ${dataToSvgY(upper[index])}`)
    .join(" ");
  const bottom = [...xs]
    .reverse()
    .map(
      (xValue, index) =>
        `L ${dataToSvgX(xValue)} ${dataToSvgY(lower[lower.length - 1 - index])}`
    )
    .join(" ");

  return `${top} ${bottom} Z`;
}

function smoothPreset(): Point[] {
  return [
    { x: -2.3, y: -1.1 },
    { x: -0.9, y: 0.25 },
    { x: 0.6, y: 1.05 },
    { x: 2.2, y: 0.45 }
  ];
}

function periodicPreset(): Point[] {
  return [
    { x: -3.0, y: 0.15 },
    { x: -1.8, y: 1.05 },
    { x: -0.6, y: -0.95 },
    { x: 0.8, y: 0.8 },
    { x: 2.1, y: -1.0 }
  ];
}

function drawPosterior(
  svg: SVGSVGElement,
  xs: number[],
  mean: number[],
  variance: number[],
  points: Point[]
): void {
  const upper = mean.map((value, index) => clamp(value + 2 * Math.sqrt(variance[index]), Y_MIN, Y_MAX));
  const lower = mean.map((value, index) => clamp(value - 2 * Math.sqrt(variance[index]), Y_MIN, Y_MAX));

  const gridLines = [-2, -1, 0, 1, 2]
    .map((tick) => {
      const y = dataToSvgY(tick);
      return `
        <line x1="${PADDING}" x2="${PLOT_WIDTH - PADDING}" y1="${y}" y2="${y}" stroke="rgba(44,35,24,0.08)" />
        <text x="8" y="${y + 4}" fill="#6b6257" font-size="11">${tick.toFixed(0)}</text>
      `;
    })
    .join("");

  const xTicks = [-4, -2, 0, 2, 4]
    .map((tick) => {
      const x = dataToSvgX(tick);
      return `
        <line x1="${x}" x2="${x}" y1="${PADDING}" y2="${PLOT_HEIGHT - PADDING}" stroke="rgba(44,35,24,0.05)" />
        <text x="${x - 6}" y="${PLOT_HEIGHT - 10}" fill="#6b6257" font-size="11">${tick.toFixed(0)}</text>
      `;
    })
    .join("");

  const pointsMarkup = points
    .map(
      (point) =>
        `<circle cx="${dataToSvgX(point.x)}" cy="${dataToSvgY(point.y)}" r="5.2" fill="#af5c35" stroke="#fff8f1" stroke-width="2" />`
    )
    .join("");

  const instructions =
    points.length === 0
      ? `<text x="${PLOT_WIDTH / 2}" y="${PLOT_HEIGHT / 2}" text-anchor="middle" fill="#6b6257" font-size="14">
           Click to add observations
         </text>`
      : "";

  svg.innerHTML = `
    <rect x="0" y="0" width="${PLOT_WIDTH}" height="${PLOT_HEIGHT}" fill="transparent"></rect>
    ${gridLines}
    ${xTicks}
    <line x1="${PADDING}" x2="${PLOT_WIDTH - PADDING}" y1="${dataToSvgY(0)}" y2="${dataToSvgY(0)}" stroke="rgba(44,35,24,0.18)" />
    <line x1="${dataToSvgX(0)}" x2="${dataToSvgX(0)}" y1="${PADDING}" y2="${PLOT_HEIGHT - PADDING}" stroke="rgba(44,35,24,0.18)" />
    <path d="${areaPath(xs, lower, upper)}" fill="rgba(175,92,53,0.18)" stroke="none" />
    <path d="${linePath(xs, mean)}" fill="none" stroke="#8d472b" stroke-width="3" stroke-linecap="round" />
    ${pointsMarkup}
    ${instructions}
  `;
}

function readParams(root: HTMLElement): KernelParams {
  return {
    kernel: root.querySelector<HTMLSelectElement>("#posterior-kernel")!.value as KernelName,
    variance: Number.parseFloat(root.querySelector<HTMLInputElement>("#posterior-variance")!.value),
    lengthScale: Number.parseFloat(
      root.querySelector<HTMLInputElement>("#posterior-length-scale")!.value
    ),
    periodicity: Number.parseFloat(
      root.querySelector<HTMLInputElement>("#posterior-periodicity")!.value
    ),
    bias: Number.parseFloat(root.querySelector<HTMLInputElement>("#posterior-bias")!.value),
    noise: Number.parseFloat(root.querySelector<HTMLInputElement>("#posterior-noise")!.value)
  };
}

export default function initPosteriorExplorer(): void {
  const root = getRoot();
  if (!root) {
    return;
  }

  const svg = root.querySelector<SVGSVGElement>("#posterior-plot");
  const summary = root.querySelector<HTMLParagraphElement>("#posterior-summary");
  if (!svg || !summary) {
    return;
  }

  const outputs = [
    ["#posterior-variance", "#posterior-variance-output"],
    ["#posterior-length-scale", "#posterior-length-scale-output"],
    ["#posterior-periodicity", "#posterior-periodicity-output"],
    ["#posterior-bias", "#posterior-bias-output"],
    ["#posterior-noise", "#posterior-noise-output"]
  ] as const;

  let points = smoothPreset();

  const render = (): void => {
    const params = readParams(root);
    const xs = linspace(X_MIN, X_MAX, 180);
    const trainX = points.map((point) => point.x);
    const trainY = points.map((point) => point.y);
    const posterior = gpPosterior(trainX, trainY, xs, params);

    drawPosterior(svg, xs, posterior.mean, posterior.variance, points);

    summary.innerHTML = `
      <strong>${points.length}</strong> observation${points.length === 1 ? "" : "s"} loaded.
      ${describeKernel(params.kernel)}
      Increasing observation noise keeps the posterior band wider near the observed points, while a shorter length scale makes the fit more local and more reactive.
    `;
  };

  outputs.forEach(([inputSelector, outputSelector]) => {
    const input = root.querySelector<HTMLInputElement>(inputSelector);
    const output = root.querySelector<HTMLOutputElement>(outputSelector);

    if (!input || !output) {
      return;
    }

    renderValue(output, Number.parseFloat(input.value));
    input.addEventListener("input", () => {
      renderValue(output, Number.parseFloat(input.value));
      render();
    });
  });

  const kernelSelect = root.querySelector<HTMLSelectElement>("#posterior-kernel");
  if (kernelSelect) {
    kernelSelect.addEventListener("change", render);
  }

  svg.addEventListener("click", (event) => {
    const point = svgToData(svg, event);
    points = [...points, point].slice(-16);
    render();
  });

  const smoothButton = root.querySelector<HTMLButtonElement>("#load-smooth");
  const periodicButton = root.querySelector<HTMLButtonElement>("#load-periodic");
  const clearButton = root.querySelector<HTMLButtonElement>("#clear-points");

  smoothButton?.addEventListener("click", () => {
    points = smoothPreset();
    render();
  });

  periodicButton?.addEventListener("click", () => {
    points = periodicPreset();
    render();
  });

  clearButton?.addEventListener("click", () => {
    points = [];
    render();
  });

  render();
}
