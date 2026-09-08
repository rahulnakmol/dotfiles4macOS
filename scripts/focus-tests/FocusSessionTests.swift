import Foundation

final class FakeDesktop: FocusDesktop {
    var events: [String] = []
    var missing: String?
    var blocked: String?
    var launchFailure: String?
    func installed(_ app: FocusApp) -> Bool { app.id != missing }
    func quitAndWait(_ app: FocusApp) throws {
        events.append("quit:" + app.id)
        if app.id == blocked { throw FocusFailure("User kept app open") }
    }
    func launch(_ app: FocusApp) throws {
        events.append("open:" + app.id)
        if app.id == launchFailure { throw FocusFailure("Launch failed") }
    }
    func openURL(_ url: String) throws { events.append("url:" + url) }
}
@main
struct FocusTests {
    static func main() throws {
        let sessions = try JSONDecoder().decode([FocusSession].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
        assert(sessions.map(\.id) == ["work", "amp", "claude", "cursor", "codex"])
        assert(sessions[0].apps.map(\.id) == ["edge", "teams"])
        assert(sessions[1].apps.map(\.id) == ["chrome", "ghostty", "amp"])
        assert(sessions[2].apps.map(\.id) == ["obsidian", "ghostty", "claude"])
        assert(sessions[3].apps.map(\.id) == ["chrome", "ghostty", "cursor"])
        assert(sessions[4].apps.map(\.id) == ["chrome", "ghostty", "codex"])
        do {
            let desktop = FakeDesktop()
            try switchFocus("codex", sessions: sessions, active: "amp", desktop: desktop)
            assert(desktop.events.contains("quit:amp"))
            assert(desktop.events.contains("quit:chrome"))
            assert(desktop.events.contains("quit:ghostty"))
            assert(desktop.events.filter { $0.hasPrefix("open:") } == ["open:chrome", "open:ghostty", "open:codex"])
            assert(desktop.events.last == "url:rectangle-pro://execute-layout?name=Code%20Codex")
            assert(desktop.events.firstIndex(of: "url:rectangle-pro://execute-layout?name=Code%20Browser")! < desktop.events.firstIndex(of: "open:codex")!)
            let leaving = FakeDesktop()
            try switchFocus("work", sessions: sessions, active: "codex", desktop: leaving)
            assert(leaving.events.contains("quit:codex"))
        }
        do {
            let desktop = FakeDesktop(); desktop.missing = "teams"
            do { try switchFocus("work", sessions: sessions, active: "amp", desktop: desktop); assertionFailure("Expected missing app") } catch {}
            assert(desktop.events.isEmpty, "Preflight before quitting")
        }
        do {
            let desktop = FakeDesktop(); desktop.blocked = "ghostty"
            do { try switchFocus("work", sessions: sessions, active: "amp", desktop: desktop); assertionFailure("Expected quit cancellation") } catch {}
            assert(!desktop.events.contains(where: { $0.hasPrefix("open:") || $0.hasPrefix("url:") }))
        }
        do {
            let desktop = FakeDesktop()
            try switchFocus("claude", sessions: sessions, active: "amp", desktop: desktop)
            assert(desktop.events.contains("quit:ghostty"), "Shared terminal must quit on a real switch")
            let lastQuit = desktop.events.lastIndex(where: { $0.hasPrefix("quit:") })!
            let firstOpen = desktop.events.firstIndex(where: { $0.hasPrefix("open:") })!
            assert(lastQuit < firstOpen)
            assert(desktop.events.filter { $0 == "quit:chrome" }.count == 1)
            assert(desktop.events.contains("url:rectangle-pro://execute-layout?name=Code%20Notes"))
            assert(desktop.events.last == "url:rectangle-pro://execute-layout?name=Code%20Claude")
            assert(desktop.events.firstIndex(of: "url:rectangle-pro://execute-layout?name=Code%20Notes")! < desktop.events.firstIndex(of: "open:claude")!)
            assert(!desktop.events.contains("open:slack"))
        }
        do {
            let desktop = FakeDesktop()
            try switchFocus("amp", sessions: sessions, active: "amp", desktop: desktop)
            assert(!desktop.events.contains("quit:ghostty"))
            assert(!desktop.events.contains("quit:chrome"))
            assert(!desktop.events.contains("quit:amp"))
        }
        do {
            let desktop = FakeDesktop()
            try switchFocus("work", sessions: sessions, active: "cursor", desktop: desktop)
            assert(desktop.events.filter { $0.hasPrefix("open:") } == ["open:edge", "open:teams"])
            assert(desktop.events.last == "url:rectangle-pro://execute-layout?name=Work")
        }
        do {
            let desktop = FakeDesktop()
            try switchFocus("claude", sessions: sessions, desktop: desktop)
            assert(!desktop.events.contains("quit:ghostty"), "First use preserves target apps without inventing session history")
            assert(!desktop.events.contains("quit:claude"))
            assert(desktop.events.contains("quit:cursor"))
        }
        do {
            let desktop = FakeDesktop(); desktop.launchFailure = "teams"
            do { try switchFocus("work", sessions: sessions, desktop: desktop); assertionFailure("Expected launch failure") } catch {}
            assert(!desktop.events.contains(where: { $0.hasPrefix("url:") }))
            let untouched = FakeDesktop()
            do { try switchFocus("invalid", sessions: sessions, desktop: untouched); assertionFailure("Expected rejection") } catch {}
            assert(untouched.events.isEmpty)
        }
        print("Focus session scenarios passed: exact five sets, preflight, cancellation, shared-app restart, reselection, first run, launch failure and invalid input")
    }
}
