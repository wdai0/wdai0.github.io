import {
  buildKernelMatrix,
  describeKernel,
  linspace,
  samplePrior
} from "./gp-math";
import type { KernelName, KernelParams } from "./gp-math";

const COLORS = ["#af5c35", "#47684b", "#9c7a2b", "#4b617c"];

function getRoot(): HTMLElement | null {
  return document.querySelector("#kernel-playground");
}

function renderValue(output: HTMLOutputElement, value: number): void {
  output.value = value.toFixed(2);
  output.textContent = value.toFixed(2);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function covarianceColor(value: number, maxAbs: number): string {
  const normalized = maxAbs === 0 ? 0.5 : (value / maxAbs + 1) / 2;

  const low = { r: 75, g: 97, b: 124 };
  const mid = { r: 249, g: 244, b: 235 };
  const high = { r: 175, g: 92, b: 53 };

  const palette = normalized < 0.5 ? [low, mid] : [mid, high];
  const localT = normalized < 0.5 ? normalized / 0.5 : (normalized - 0.5) / 0.5;
  const r = Math.round(palette[0].r + (palette[1].r - palette[0].r) * localT);
  const g = Math.round(palette[0].g + (palette[1].g - palette[0].g) * localT);
  const b = Math.round(palette[0].b + (palette[1].b - palette[0].b) * localT);

  return `rgb(${r}, ${g}, ${b})`;
}

function drawSamples(svg: SVGSVGElement, xs: number[], samples: number[][]): void {
  const width = 680;
  const height = 340;
  const padding = 34;
  const values = samples.flat();
  const minY = Math.min(...values, -2.5);
  const maxY = Math.max(...values, 2.5);
  const yRange = Math.max(maxY - minY, 1e-6);

  const gridLines = [-2, -1, 0, 1, 2]
    .map((tick) => {
      const y = height - padding - ((tick - minY) / yRange) * (height - padding * 2);
      return `
        <line x1="${padding}" x2="${width - padding}" y1="${y}" y2="${y}" stroke="rgba(44,35,24,0.08)" />
        <text x="10" y="${y + 4}" fill="#6b6257" font-size="11">${tick.toFixed(0)}</text>
      `;
    })
    .join("");

  const paths = samples
    .map((sample, index) => {
      const path = xs
        .map((xValue, pointIndex) => {
          const x = padding + ((xValue - xs[0]) / (xs[xs.length - 1] - xs[0])) * (width - padding * 2);
          const y =
            height - padding - ((sample[pointIndex] - minY) / yRange) * (height - padding * 2);
          return `${pointIndex === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");

      return `<path d="${path}" fill="none" stroke="${COLORS[index % COLORS.length]}" stroke-width="3" stroke-linecap="round" />`;
    })
    .join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
    ${gridLines}
    <line x1="${padding}" x2="${width - padding}" y1="${height - padding}" y2="${height - padding}" stroke="rgba(44,35,24,0.18)" />
    <line x1="${padding}" x2="${padding}" y1="${padding}" y2="${height - padding}" stroke="rgba(44,35,24,0.18)" />
    ${paths}
  `;
}

function drawCovariance(svg: SVGSVGElement, matrix: number[][]): void {
  const width = 420;
  const height = 420;
  const padding = 26;
  const cellWidth = (width - padding * 2) / matrix.length;
  const flat = matrix.flat();
  const maxAbs = Math.max(...flat.map((value) => Math.abs(value)), 1e-6);

  const cells = matrix
    .map((row, rowIndex) =>
      row
        .map((value, columnIndex) => {
          const x = padding + columnIndex * cellWidth;
          const y = padding + rowIndex * cellWidth;
          return `<rect x="${x}" y="${y}" width="${cellWidth + 0.5}" height="${cellWidth + 0.5}" fill="${covarianceColor(value, maxAbs)}" />`;
        })
        .join("")
    )
    .join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
    <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" rx="18" fill="none" stroke="rgba(44,35,24,0.15)" />
    ${cells}
  `;
}

function readParams(root: HTMLElement): KernelParams {
  const kernel = root.querySelector<HTMLSelectElement>("#kernel-type")!;
  const variance = root.querySelector<HTMLInputElement>("#variance")!;
  const lengthScale = root.querySelector<HTMLInputElement>("#length-scale")!;
  const periodicity = root.querySelector<HTMLInputElement>("#periodicity")!;
  const bias = root.querySelector<HTMLInputElement>("#bias")!;

  return {
    kernel: kernel.value as KernelName,
    variance: Number.parseFloat(variance.value),
    lengthScale: Number.parseFloat(lengthScale.value),
    periodicity: Number.parseFloat(periodicity.value),
    bias: Number.parseFloat(bias.value),
    noise: 0.08
  };
}

export default function initKernelPlayground(): void {
  const root = getRoot();
  if (!root) {
    return;
  }

  const sampleSvg = root.querySelector<SVGSVGElement>("#kernel-sample-plot");
  const covarianceSvg = root.querySelector<SVGSVGElement>("#kernel-covariance-plot");
  const summary = root.querySelector<HTMLParagraphElement>("#kernel-summary");
  const sampleCaption = root.querySelector<HTMLParagraphElement>("#kernel-sample-caption");
  const covarianceCaption = root.querySelector<HTMLParagraphElement>("#kernel-covariance-caption");

  if (!sampleSvg || !covarianceSvg || !summary || !sampleCaption || !covarianceCaption) {
    return;
  }

  const outputs = [
    ["#variance", "#variance-output"],
    ["#length-scale", "#length-scale-output"],
    ["#periodicity", "#periodicity-output"],
    ["#bias", "#bias-output"]
  ] as const;

  const render = (): void => {
    const params = readParams(root);
    const xs = linspace(-2.8, 2.8, 48);
    const heatmapXs = linspace(-2.4, 2.4, 20);
    const samples = samplePrior(xs, params, 4);
    const covariance = buildKernelMatrix(heatmapXs, params);

    drawSamples(sampleSvg, xs, samples);
    drawCovariance(covarianceSvg, covariance);

    sampleCaption.textContent = `${params.kernel.toUpperCase()} prior draws across a one-dimensional input domain.`;
    covarianceCaption.textContent = `Diagonal intensity tracks marginal variance; off-diagonal structure reveals correlation decay.`;

    summary.innerHTML = `
      <strong>${escapeHtml(params.kernel.toUpperCase())} kernel:</strong>
      ${escapeHtml(describeKernel(params.kernel))}
      Larger variance scales the overall vertical spread, while length scale changes how quickly nearby inputs stop influencing one another.
      ${params.kernel === "periodic" ? " The periodicity slider controls the repeat interval directly." : ""}
      ${params.kernel === "linear" ? " The bias slider shifts the point where the linear kernel has zero covariance." : ""}
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

  const kernelSelect = root.querySelector<HTMLSelectElement>("#kernel-type");
  if (kernelSelect) {
    kernelSelect.addEventListener("change", render);
  }

  render();
}
