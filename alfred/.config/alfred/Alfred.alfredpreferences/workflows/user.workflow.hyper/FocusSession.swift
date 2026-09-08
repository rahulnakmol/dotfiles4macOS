import AppKit

struct FocusApp: Codable, Equatable {
    let id: String
    let name: String
    let bundleId: String
}
struct FocusSession: Codable {
    let id: String
    let name: String
    let apps: [FocusApp]
    let dockURL: String?
    let layoutURL: String?
    let pairLayoutURL: String?
}
struct FocusFailure: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}
protocol FocusDesktop {
    func installed(_ app: FocusApp) -> Bool
    func quitAndWait(_ app: FocusApp) throws
    func launch(_ app: FocusApp) throws
    func openURL(_ url: String) throws
}

// Only the other configured session's apps are eligible for quitting.
// A local session ID distinguishes a real switch from reselecting the same session.
func switchFocus(_ id: String, sessions: [FocusSession], active: String? = nil, desktop: FocusDesktop) throws {
    guard let target = sessions.first(where: { $0.id == id }) else {
        throw FocusFailure("Unknown focus session: \(id)")
    }
    for app in target.apps where !desktop.installed(app) {
        throw FocusFailure("Install \(app.name) before starting \(target.name). No apps were quit.")
    }
    let keep = Set(target.apps.map(\.bundleId))
    var handled = Set<String>()
    let outgoing = sessions.filter { $0.id != id }
    for session in outgoing {
        for app in session.apps where (session.id == active || !keep.contains(app.bundleId)) && handled.insert(app.bundleId).inserted {
            try desktop.quitAndWait(app)
        }
    }
    if let pair = target.pairLayoutURL {
        for app in target.apps.dropLast() { try desktop.launch(app) }
        try desktop.openURL(pair)
        if let agent = target.apps.last { try desktop.launch(agent) }
    } else {
        for app in target.apps { try desktop.launch(app) }
    }
    if let url = target.dockURL { try desktop.openURL(url) }
    if let url = target.layoutURL { try desktop.openURL(url) }
}

struct MacFocusDesktop: FocusDesktop {
    func installed(_ app: FocusApp) -> Bool {
        NSWorkspace.shared.urlForApplication(withBundleIdentifier: app.bundleId) != nil
    }
    func quitAndWait(_ app: FocusApp) throws {
        let running = NSRunningApplication.runningApplications(withBundleIdentifier: app.bundleId)
        for process in running where !process.isTerminated {
            if !process.terminate() && !process.isTerminated {
                throw FocusFailure("\(app.name) declined to quit. Finish or save your work, then retry.")
            }
        }
        let deadline = Date().addingTimeInterval(30)
        while !NSRunningApplication.runningApplications(withBundleIdentifier: app.bundleId).isEmpty {
            guard Date() < deadline else {
                throw FocusFailure("\(app.name) is still open. Resolve its quit/save prompt, then retry. The next session was not opened.")
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
    }
    func launch(_ app: FocusApp) throws {
        try open(["-b", app.bundleId])
    }
    func openURL(_ url: String) throws {
        guard let scheme = URL(string: url)?.scheme, ["dockflow", "rectangle-pro"].contains(scheme) else {
            throw FocusFailure("Unsupported focus layout URL")
        }
        try open(["-g", url])
        if url.hasPrefix("rectangle-pro://execute-layout") {
            for _ in 0..<2 {
                RunLoop.current.run(until: Date().addingTimeInterval(0.8))
                try open(["-g", url])
            }
        }
    }
    private func open(_ arguments: [String]) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
        process.arguments = arguments
        try process.run()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else { throw FocusFailure("macOS could not open a focus app or layout. Retry after checking the app.") }
    }
}

#if !FOCUS_TEST
@main
struct FocusMain {
    static func main() {
        do {
            let args = Array(CommandLine.arguments.dropFirst())
            guard args.count == 2 || (args.count == 3 && args[2] == "--dry-run") else {
                throw FocusFailure("Usage: focus-session CONFIG SESSION [--dry-run]")
            }
            let sessions = try JSONDecoder().decode([FocusSession].self, from: Data(contentsOf: URL(fileURLWithPath: args[0])))
            guard let target = sessions.first(where: { $0.id == args[1] }) else { throw FocusFailure("Unknown focus session") }
            if args.count == 3 {
                let keep = Set(target.apps.map(\.bundleId))
                let quit = sessions.filter { $0.id != target.id }.flatMap(\.apps).filter { !keep.contains($0.bundleId) }
                print("Quit if running: " + quit.map(\.name).joined(separator: ", "))
                print("Open: " + target.apps.map(\.name).joined(separator: ", "))
                return
            }
            // flock is released by the OS even if the process exits unexpectedly.
            let lockPath = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Caches/com.rahulnakmol.hyper/focus.lock")
            try FileManager.default.createDirectory(at: lockPath.deletingLastPathComponent(), withIntermediateDirectories: true)
            let fd = Darwin.open(lockPath.path, O_CREAT | O_RDWR, S_IRUSR | S_IWUSR)
            guard fd >= 0 else { throw FocusFailure("Could not create focus-session lock") }
            defer { Darwin.close(fd) }
            guard flock(fd, LOCK_EX | LOCK_NB) == 0 else { throw FocusFailure("Another focus switch is still running. Finish any save prompt first.") }
            let statePath = lockPath.deletingLastPathComponent().appendingPathComponent("active-session")
            let active = try? String(contentsOf: statePath, encoding: .utf8)
            try switchFocus(target.id, sessions: sessions, active: active, desktop: MacFocusDesktop())
            try target.id.write(to: statePath, atomically: true, encoding: .utf8)
            print("\(target.name) focus ready")
        } catch {
            print("Focus switch stopped: \(error)")
            exit(1)
        }
    }
}
#endif
