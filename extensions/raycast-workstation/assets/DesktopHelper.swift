import AppKit

struct RunningApp: Codable {
    let pid: Int32
    let bundleId: String
    let name: String
}
enum Failure: Error { case invalidArguments, changedProcess, refusedQuit }

// Only public NSWorkspace metadata is inspected. No Accessibility scripting,
// application documents, browser state, credentials or force termination.
let args = Array(CommandLine.arguments.dropFirst())
do {
    if args == ["running"] {
        let apps = NSWorkspace.shared.runningApplications.filter {
            $0.activationPolicy == .regular && !$0.isTerminated
        }.map { RunningApp(pid: $0.processIdentifier, bundleId: $0.bundleIdentifier ?? "", name: $0.localizedName ?? "Application") }
        print(String(decoding: try JSONEncoder().encode(apps), as: UTF8.self))
    } else if args.count == 3 && args[0] == "quit", let pid = Int32(args[1]) {
        if let app = NSRunningApplication(processIdentifier: pid), !app.isTerminated {
            guard app.bundleIdentifier == args[2] else { throw Failure.changedProcess }
            guard app.terminate() || app.isTerminated else { throw Failure.refusedQuit }
            let deadline = Date().addingTimeInterval(30)
            while !app.isTerminated {
                guard Date() < deadline else { throw Failure.refusedQuit }
                RunLoop.current.run(until: Date().addingTimeInterval(0.1))
            }
        }
        print("ok")
    } else { throw Failure.invalidArguments }
} catch {
    fputs("Normal quit did not complete. Resolve the application's save prompt and retry.\n", stderr)
    exit(1)
}
