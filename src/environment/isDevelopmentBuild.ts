declare const process: { env: { NODE_ENV: string } };

/** True only when the bundler replaced `process.env.NODE_ENV` with "development"; fails closed otherwise. */
export default function isDevelopmentBuild(): boolean {
  try {
    return process.env.NODE_ENV === 'development';
  } catch {
    return false;
  }
}
