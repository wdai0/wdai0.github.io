export type KernelName = "rbf" | "matern32" | "periodic" | "linear";

export interface KernelParams {
  kernel: KernelName;
  variance: number;
  lengthScale: number;
  periodicity: number;
  bias: number;
  noise: number;
}

const BASE_JITTER = 1e-6;

export function linspace(start: number, end: number, count: number): number[] {
  if (count <= 1) {
    return [start];
  }

  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function kernelValue(left: number, right: number, params: KernelParams): number {
  const distance = Math.abs(left - right);
  const safeLength = Math.max(params.lengthScale, 1e-4);
  const variance = Math.max(params.variance, 1e-6);

  switch (params.kernel) {
    case "rbf":
      return variance * Math.exp(-((distance * distance) / (2 * safeLength * safeLength)));
    case "matern32": {
      const scaled = (Math.sqrt(3) * distance) / safeLength;
      return variance * (1 + scaled) * Math.exp(-scaled);
    }
    case "periodic": {
      const periodicity = Math.max(params.periodicity, 1e-4);
      const sine = Math.sin((Math.PI * distance) / periodicity);
      return variance * Math.exp((-2 * sine * sine) / (safeLength * safeLength));
    }
    case "linear":
      return variance * (left - params.bias) * (right - params.bias);
    default:
      return variance;
  }
}

export function buildKernelMatrix(
  xs: number[],
  params: KernelParams,
  diagonalNoise = 0
): number[][] {
  return xs.map((left, rowIndex) =>
    xs.map((right, columnIndex) => {
      const base = kernelValue(left, right, params);
      return rowIndex === columnIndex ? base + diagonalNoise : base;
    })
  );
}

function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const lower = Array.from({ length: n }, () => Array(n).fill(0));

  for (let row = 0; row < n; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = 0;
      for (let index = 0; index < column; index += 1) {
        sum += lower[row][index] * lower[column][index];
      }

      if (row === column) {
        const diagonalValue = matrix[row][row] - sum;
        if (diagonalValue <= 0) {
          throw new Error("Matrix is not numerically positive definite.");
        }
        lower[row][column] = Math.sqrt(diagonalValue);
      } else {
        lower[row][column] = (matrix[row][column] - sum) / lower[column][column];
      }
    }
  }

  return lower;
}

export function stableCholesky(matrix: number[][]): number[][] {
  let jitter = BASE_JITTER;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const candidate = cloneMatrix(matrix);
    for (let index = 0; index < candidate.length; index += 1) {
      candidate[index][index] += jitter;
    }

    try {
      return choleskyDecomposition(candidate);
    } catch {
      jitter *= 10;
    }
  }

  throw new Error("Unable to stabilize covariance matrix.");
}

function solveLowerTriangular(lower: number[][], vector: number[]): number[] {
  const result = Array(lower.length).fill(0);

  for (let row = 0; row < lower.length; row += 1) {
    let sum = 0;
    for (let column = 0; column < row; column += 1) {
      sum += lower[row][column] * result[column];
    }
    result[row] = (vector[row] - sum) / lower[row][row];
  }

  return result;
}

function solveUpperTriangular(lower: number[][], vector: number[]): number[] {
  const n = lower.length;
  const result = Array(n).fill(0);

  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = 0;
    for (let column = row + 1; column < n; column += 1) {
      sum += lower[column][row] * result[column];
    }
    result[row] = (vector[row] - sum) / lower[row][row];
  }

  return result;
}

export function solveCholesky(lower: number[][], vector: number[]): number[] {
  return solveUpperTriangular(lower, solveLowerTriangular(lower, vector));
}

function standardNormal(): number {
  let u1 = 0;
  let u2 = 0;

  while (u1 === 0) {
    u1 = Math.random();
  }

  while (u2 === 0) {
    u2 = Math.random();
  }

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function lowerTriangularMultiply(lower: number[][], vector: number[]): number[] {
  return lower.map((row, rowIndex) => {
    let sum = 0;
    for (let column = 0; column <= rowIndex; column += 1) {
      sum += row[column] * vector[column];
    }
    return sum;
  });
}

export function samplePrior(xs: number[], params: KernelParams, sampleCount: number): number[][] {
  const covariance = buildKernelMatrix(xs, params);
  const lower = stableCholesky(covariance);

  return Array.from({ length: sampleCount }, () => {
    const noise = xs.map(() => standardNormal());
    return lowerTriangularMultiply(lower, noise);
  });
}

export function gpPosterior(
  trainX: number[],
  trainY: number[],
  xs: number[],
  params: KernelParams
): { mean: number[]; variance: number[] } {
  if (trainX.length === 0) {
    const variance = xs.map((value) => Math.max(kernelValue(value, value, params), BASE_JITTER));
    return {
      mean: xs.map(() => 0),
      variance
    };
  }

  const observationNoise = Math.max(params.noise, 1e-6);
  const kernelMatrix = buildKernelMatrix(trainX, params, observationNoise * observationNoise);
  const lower = stableCholesky(kernelMatrix);
  const alpha = solveCholesky(lower, trainY);

  const mean = xs.map((xStar) => {
    const kStar = trainX.map((xTrain) => kernelValue(xTrain, xStar, params));
    return dot(kStar, alpha);
  });

  const variance = xs.map((xStar) => {
    const kStar = trainX.map((xTrain) => kernelValue(xTrain, xStar, params));
    const lowerSolution = solveLowerTriangular(lower, kStar);
    const reduction = dot(lowerSolution, lowerSolution);
    return Math.max(kernelValue(xStar, xStar, params) - reduction, BASE_JITTER);
  });

  return { mean, variance };
}

export function describeKernel(kernel: KernelName): string {
  switch (kernel) {
    case "rbf":
      return "RBF assumes very smooth functions and strong local correlation.";
    case "matern32":
      return "Matern 3/2 keeps local smoothness but allows rougher behavior than the RBF kernel.";
    case "periodic":
      return "Periodic enforces repeating structure, so distant points can remain highly correlated.";
    case "linear":
      return "Linear produces affine trend-like behavior and covariance that grows with distance from the bias point.";
    default:
      return "";
  }
}

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}
