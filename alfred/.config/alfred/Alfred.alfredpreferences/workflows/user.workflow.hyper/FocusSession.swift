import AppKit

struct FocusApp: Codable, Equatable {
    let id: String
    let name: String
    let bundleId: String
    var processId: Int32? = nil
}
struct FocusSession: Codable {
    let id: String
    let name: String
    let apps: [FocusApp]
    let dockURL: String?
    let layoutURL: String?
    let pairLayoutURL: String?
    let durationMinutes: Int
    var dockName: String? = nil
    var categoryName: String? = nil

    var timerURL: String {
        var url = URLComponents()
        url.scheme = "session"
        url.host = ""
        url.path = "/start"
        url.queryItems = [URLQueryItem(name: "intent", value: "Focus Session: \(name)"),
                          URLQueryItem(name: "duration", value: String(durationMinutes))]
        if let categoryName, !categoryName.isEmpty {
            url.queryItems?.append(URLQueryItem(name: "categoryName", value: categoryName))
        }
        // Some URL handlers treat literal plus as a space in query parameters.
        url.percentEncodedQuery = url.percentEncodedQuery?.replacingOccurrences(of: "+", with: "%2B")
        return url.string!
    }
}
let sessionTimerApps = ["com.philipyoungg.session-setapp", "com.philipyoungg.session-direct", "com.philipyoungg.session"].map {
    FocusApp(id: "session-timer", name: "Session", bundleId: $0)
}
struct FocusFailure: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}
// Preserve the desktop shell, workflow host, layout engine and timer.
// Accessory/menu-bar agents are excluded by runningApps(), not killed by name.
let focusSupportBundleIds = Set(sessionTimerApps.map(\.bundleId) + [
    "com.apple.finder", "com.runningwithcrayons.Alfred", "com.knollsoft.Hookshot", "com.appit.DockFlow"
])
protocol FocusDesktop {
    func runningApps() -> [FocusApp]
    func installed(_ app: FocusApp) -> Bool
    func quitAndWait(_ app: FocusApp) throws
    func launch(_ app: FocusApp) throws
    func openURL(_ url: String) throws
    func checkDockPreset(_ name: String) throws
    func applyDockPreset(_ name: String) throws
}

func appsToQuit(for target: FocusSession, running: [FocusApp]) -> [FocusApp] {
    let keep = Set(target.apps.map(\.bundleId)).union(focusSupportBundleIds)
    return running.filter { !keep.contains($0.bundleId) }
}

// Every invocation clears unrelated regular apps, including first use/reselection.
func switchFocus(_ id: String, sessions: [FocusSession], desktop: FocusDesktop) throws {
    guard let target = sessions.first(where: { $0.id == id }) else {
        throw FocusFailure("Unknown focus session: \(id)")
    }
    guard (1...1440).contains(target.durationMinutes) else { throw FocusFailure("Invalid focus timer duration. No apps were quit.") }
    guard sessionTimerApps.contains(where: { desktop.installed($0) }) else {
        throw FocusFailure("Install Session (Setapp, direct or App Store edition) before starting a timed focus session. No apps were quit.")
    }
    for app in target.apps where !desktop.installed(app) {
        throw FocusFailure("Install \(app.name) before starting \(target.name). No apps were quit.")
    }
    if let name = target.dockName { try desktop.checkDockPreset(name) }
    for app in appsToQuit(for: target, running: desktop.runningApps()) {
        try desktop.quitAndWait(app)
    }
    let remaining = appsToQuit(for: target, running: desktop.runningApps())
    guard remaining.isEmpty else {
        throw FocusFailure("Other apps are still running: \(remaining.map(\.name).joined(separator: ", ")). Resolve their prompts, then retry.")
    }
    if let pair = target.pairLayoutURL {
        for app in target.apps.dropLast() { try desktop.launch(app) }
        try desktop.openURL(pair)
        if let agent = target.apps.last { try desktop.launch(agent) }
    } else {
        for app in target.apps { try desktop.launch(app) }
    }
    if let name = target.dockName { try desktop.applyDockPreset(name) }
    else if let url = target.dockURL { try desktop.openURL(url) }
    if let url = target.layoutURL { try desktop.openURL(url) }
    // Start once, only after all app launches and layout requests succeed.
    // Session owns any existing-timer prompt; never abandon or finish it silently.
    try desktop.openURL(target.timerURL)
}

struct MacFocusDesktop: FocusDesktop {
    private func dockCLI(_ arguments: [String]) throws -> String {
        guard let app = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.appit.DockFlow") else {
            throw FocusFailure("Install DockFlow and import the selected preset pack first. No timer was started.")
        }
        let process = Process(), output = Pipe()
        process.executableURL = app.appendingPathComponent("Contents/MacOS/DockFlowCLI")
        process.arguments = arguments
        process.standardOutput = output
        process.standardError = output
        try process.run()
        let data = output.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else { throw FocusFailure("DockFlow command failed. Check its preset import and integration.") }
        return String(decoding: data, as: UTF8.self)
    }
    func checkDockPreset(_ name: String) throws {
        let lines = try dockCLI(["list"]).components(separatedBy: "\n")
        let count = lines.filter { $0.hasPrefix("- \(name) (ID: ") && $0.hasSuffix(")") }.count
        guard count == 1 else { throw FocusFailure("DockFlow needs exactly one preset named \(name). Import the pack or rename duplicates before starting focus.") }
    }
    func applyDockPreset(_ name: String) throws {
        try checkDockPreset(name)
        _ = try dockCLI(["apply", "--name", name])
    }
    func runningApps() -> [FocusApp] {
        NSWorkspace.shared.runningApplications.filter { $0.activationPolicy == .regular && !$0.isTerminated }.map {
            FocusApp(id: $0.bundleIdentifier ?? "pid-\($0.processIdentifier)", name: $0.localizedName ?? "Application \($0.processIdentifier)",
                     bundleId: $0.bundleIdentifier ?? "", processId: $0.processIdentifier)
        }
    }
    func installed(_ app: FocusApp) -> Bool {
        NSWorkspace.shared.urlForApplication(withBundleIdentifier: app.bundleId) != nil
    }
    func quitAndWait(_ app: FocusApp) throws {
        let running: [NSRunningApplication]
        if let pid = app.processId {
            running = NSRunningApplication(processIdentifier: pid).map { [$0] } ?? []
        } else {
            running = NSRunningApplication.runningApplications(withBundleIdentifier: app.bundleId)
        }
        for process in running where !process.isTerminated {
            if !process.terminate() && !process.isTerminated {
                throw FocusFailure("\(app.name) declined to quit. Finish or save your work, then retry.")
            }
        }
        let deadline = Date().addingTimeInterval(30)
        while running.contains(where: { !$0.isTerminated }) {
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
        if let components = URLComponents(string: url), components.scheme == "session", components.path == "/start",
           components.host == nil || components.host == "" {
            guard let app = sessionTimerApps.first(where: { installed($0) }) else { throw FocusFailure("Session is no longer installed. Timer was not requested.") }
            try open(["-g", "-b", app.bundleId, url])
            return
        }
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
                let quit = appsToQuit(for: target, running: MacFocusDesktop().runningApps())
                print("Quit if running: " + quit.map(\.name).joined(separator: ", "))
                print("Open: " + target.apps.map(\.name).joined(separator: ", "))
                print("Then request Session timer: \(target.durationMinutes) minutes · \(target.name)")
                return
            }
            // flock is released by the OS even if the process exits unexpectedly.
            let lockPath = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Caches/com.rahulnakmol.hyper/focus.lock")
            try FileManager.default.createDirectory(at: lockPath.deletingLastPathComponent(), withIntermediateDirectories: true)
            let fd = Darwin.open(lockPath.path, O_CREAT | O_RDWR, S_IRUSR | S_IWUSR)
            guard fd >= 0 else { throw FocusFailure("Could not create focus-session lock") }
            defer { Darwin.close(fd) }
            guard flock(fd, LOCK_EX | LOCK_NB) == 0 else { throw FocusFailure("Another focus switch is still running. Finish any save prompt first.") }
            try switchFocus(target.id, sessions: sessions, desktop: MacFocusDesktop())
            print("\(target.name) focus ready · \(target.durationMinutes)-minute Session timer requested")
        } catch {
            print("Focus switch stopped: \(error)")
            exit(1)
        }
    }
}
#endif
