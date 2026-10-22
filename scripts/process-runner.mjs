const WINDOWS_COMMAND_SHELL = "cmd.exe";

function assertArguments(args) {
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== "string")) {
    throw new TypeError("Process arguments must be an array of strings");
  }
}

export function createProcessInvocation(executable, args = [], platform = process.platform) {
  if (typeof executable !== "string" || executable.length === 0) {
    throw new TypeError("Process executable must be a non-empty string");
  }

  assertArguments(args);

  if (platform === "win32") {
    return {
      command: WINDOWS_COMMAND_SHELL,
      args: ["/d", "/s", "/c", executable, ...args],
    };
  }

  return { command: executable, args: [...args] };
}
