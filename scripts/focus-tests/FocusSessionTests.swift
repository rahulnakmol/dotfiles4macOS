import Foundation

final class FakeDesktop: FocusDesktop {
    var events: [String] = []
    var running: [FocusApp] = []
    var reopening: String?
    func runningApps() -> [FocusApp] { running }
    var missing: String?
    var blocked: String?
    var launchFailure: String?
    var urlFailure: String?
    var dockMissing = false
    func checkDockPreset(_ name: String) throws {
        if dockMissing { throw FocusFailure("Missing Dock preset") }
        events.append("check-dock:" + name)
    }
    func applyDockPreset(_ name: String) throws { events.append("dock:" + name) }
    func installed(_ app: FocusApp) -> Bool { app.id != missing }
    func quitAndWait(_ app: FocusApp) throws {
        events.append("quit:" + app.id)
        if app.id == blocked { throw FocusFailure("User kept app open") }
        if app.id != reopening { running.removeAll { $0.id == app.id } }
    }
    func launch(_ app: FocusApp) throws {
        events.append("open:" + app.id)
        if app.id == launchFailure { throw FocusFailure("Launch failed") }
        if !running.contains(where: { $0.id == app.id }) { running.append(app) }
    }
    func openURL(_ url: String) throws {
        events.append("url:" + url)
        if url == urlFailure { throw FocusFailure("URL delivery failed") }
    }
}
@main
struct FocusTests {
    static func main() throws {
        let sessions = try JSONDecoder().decode([FocusSession].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
        assert(sessions.map(\.id) == ["work", "amp", "claude", "cursor", "t3code"])
        assert(sessions[0].apps.map(\.id) == ["edge", "teams"])
        assert(sessions[1].apps.map(\.id) == ["zen-browser", "ghostty", "slack", "amp"])
        assert(sessions[2].apps.map(\.id) == ["zen-browser", "ghostty", "slack", "claude"])
        assert(sessions[3].apps.map(\.id) == ["zen-browser", "ghostty", "slack", "cursor"])
        assert(sessions[4].apps.map(\.id) == ["zen-browser", "ghostty", "slack", "t3code"])
        func populatedDesktop() -> FakeDesktop {
            let desktop = FakeDesktop()
            var seen = Set<String>()
            desktop.running = sessions.flatMap(\.apps).filter { seen.insert($0.id).inserted }
            desktop.running += [FocusApp(id: "outlook", name: "Outlook", bundleId: "com.microsoft.Outlook"),
                                FocusApp(id: "unknown", name: "Unbundled app", bundleId: "", processId: 123)]
            desktop.running += focusSupportBundleIds.sorted().map { FocusApp(id: $0, name: $0, bundleId: $0) }
            return desktop
        }
        for target in sessions {
            let desktop = populatedDesktop()
            try switchFocus(target.id, sessions: sessions, desktop: desktop)
            let keep = Set(target.apps.map(\.bundleId)).union(focusSupportBundleIds)
            assert(desktop.running.allSatisfy { keep.contains($0.bundleId) })
            assert(desktop.events.contains("quit:outlook") && desktop.events.contains("quit:unknown"))
            assert(desktop.events.contains("quit:slack") == !target.apps.contains(where: { $0.id == "slack" }))
            for app in target.apps { assert(!desktop.events.contains("quit:" + app.id), "Preserve every target app, even shared browsers/terminals") }
            for id in focusSupportBundleIds { assert(!desktop.events.contains("quit:" + id)) }
            let lastQuit = desktop.events.lastIndex(where: { $0.hasPrefix("quit:") })!
            let firstOpen = desktop.events.firstIndex(where: { $0.hasPrefix("open:") })!
            assert(lastQuit < firstOpen)
            assert(desktop.events.filter { $0.hasPrefix("open:") } == target.apps.map { "open:" + $0.id })
            assert(desktop.events.last == "url:" + target.timerURL)
            assert(desktop.events[desktop.events.count - 2] == "url:" + target.layoutURL!)
            if let pair = target.pairLayoutURL {
                assert(desktop.events.firstIndex(of: "url:" + pair)! < desktop.events.firstIndex(of: "open:" + target.apps.last!.id)!)
            }
            // Reselecting cleans up newly opened distractions while retaining target apps.
            desktop.events = []
            desktop.running.append(FocusApp(id: "mail", name: "Mail", bundleId: "com.apple.mail"))
            try switchFocus(target.id, sessions: sessions, desktop: desktop)
            assert(desktop.events.filter { $0.hasPrefix("quit:") } == ["quit:mail"])
        }
        do {
            let desktop = populatedDesktop(); desktop.missing = "teams"
            do { try switchFocus("work", sessions: sessions, desktop: desktop); assertionFailure("Expected missing app") } catch {}
            assert(desktop.events.isEmpty, "Preflight before quitting")
            let blocked = populatedDesktop(); blocked.blocked = "slack"
            do { try switchFocus("work", sessions: sessions, desktop: blocked); assertionFailure("Expected quit cancellation") } catch {}
            assert(!blocked.events.contains(where: { $0.hasPrefix("open:") || $0.hasPrefix("url:") }))
            let reopened = populatedDesktop(); reopened.reopening = "outlook"
            do { try switchFocus("work", sessions: sessions, desktop: reopened); assertionFailure("Expected remaining-app barrier") } catch {}
            assert(!reopened.events.contains(where: { $0.hasPrefix("open:") || $0.hasPrefix("url:") }))
        }
        do {
            let desktop = FakeDesktop(); desktop.launchFailure = "teams"
            do { try switchFocus("work", sessions: sessions, desktop: desktop); assertionFailure("Expected launch failure") } catch {}
            assert(!desktop.events.contains(where: { $0.hasPrefix("url:") }))
            let untouched = populatedDesktop()
            do { try switchFocus("invalid", sessions: sessions, desktop: untouched); assertionFailure("Expected rejection") } catch {}
            assert(untouched.events.isEmpty)
        }
        for session in sessions {
            assert(session.durationMinutes == (session.id == "work" ? 30 : 45))
            assert(session.categoryName == (session.id == "work" ? "Work" : "Code"))
            let url = URLComponents(string: session.timerURL)!
            assert(url.scheme == "session" && url.path == "/start")
            assert(url.queryItems!.first(where: { $0.name == "categoryName" })!.value == session.categoryName)
            assert(url.queryItems!.first(where: { $0.name == "intent" })!.value == "Focus Session: " + session.name)
            let desktop = FakeDesktop()
            try switchFocus(session.id, sessions: sessions, desktop: desktop)
            assert(desktop.events.filter { $0 == "url:" + session.timerURL }.count == 1)
            assert(desktop.events.last == "url:" + session.timerURL)
        }
        do {
            let desktop = FakeDesktop(); desktop.missing = "session-timer"
            do { try switchFocus("work", sessions: sessions, desktop: desktop); assertionFailure("Expected missing Session") } catch {}
            assert(desktop.events.isEmpty, "Missing timer must stop before quitting apps")
            let layoutFailed = FakeDesktop(); layoutFailed.urlFailure = sessions[0].layoutURL
            do { try switchFocus("work", sessions: sessions, desktop: layoutFailed); assertionFailure("Expected layout failure") } catch {}
            assert(!layoutFailed.events.contains("url:" + sessions[0].timerURL))
            let timerFailed = FakeDesktop(); timerFailed.urlFailure = sessions[0].timerURL
            do { try switchFocus("work", sessions: sessions, desktop: timerFailed); assertionFailure("Expected timer delivery failure") } catch {}
            assert(timerFailed.events.filter { $0 == "url:" + sessions[0].timerURL }.count == 1, "Never retry timer starts automatically")
        }
        do {
            let invalid = FocusSession(id: "invalid-duration", name: "Code + A&B #1", apps: [], dockURL: nil, layoutURL: nil, pairLayoutURL: nil, durationMinutes: 0)
            let desktop = FakeDesktop()
            do { try switchFocus(invalid.id, sessions: [invalid], desktop: desktop); assertionFailure("Expected invalid duration") } catch {}
            assert(desktop.events.isEmpty)
            let url = URLComponents(string: invalid.timerURL)!
            assert(url.queryItems!.first!.value == "Focus Session: Code + A&B #1")
            assert(url.queryItems!.count == 2, "Legacy configuration without categories remains valid")
            var named = invalid
            named.categoryName = "R&D + Code #1"
            let namedURL = URLComponents(string: named.timerURL)!
            assert(namedURL.queryItems!.count == 3, "Category text must not inject URL parameters")
            assert(namedURL.queryItems!.last!.value == "R&D + Code #1")
            assert(!named.timerURL.contains("+"), "Literal plus must be escaped")
        }
        if CommandLine.arguments.count > 2 {
            let tf = try JSONDecoder().decode([FocusSession].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
            assert(tf.map(\.id) == ["work", "code", "innovate"])
            assert(tf[0].apps.map(\.id) == ["edge", "teams", "claude"])
            assert(tf[1].apps.map(\.id) == ["zen-browser", "ghostty", "slack", "cursor"])
            assert(tf[2].apps.map(\.id) == ["zen-browser", "ghostty", "slack", "codex"])
            assert(tf.map(\.categoryName) == ["Work", "Code", "Innovate"])
            for target in tf {
                let timer = URLComponents(string: target.timerURL)!
                assert(timer.queryItems!.first(where: { $0.name == "categoryName" })!.value == target.categoryName)
                let desktop = populatedDesktop()
                try switchFocus(target.id, sessions: tf, desktop: desktop)
                assert(desktop.events.first == "check-dock:" + target.dockName!)
                assert(desktop.events.contains("dock:" + target.dockName!))
                assert(desktop.events.last == "url:" + target.timerURL)
                for app in target.apps { assert(!desktop.events.contains("quit:" + app.id)) }
                assert(Set(desktop.running.map(\.bundleId)).isSubset(of: Set(target.apps.map(\.bundleId)).union(focusSupportBundleIds)))
                assert(desktop.events.filter { $0.hasPrefix("open:") } == target.apps.map { "open:" + $0.id })
                if let pair = target.pairLayoutURL {
                    assert(desktop.events.firstIndex(of: "url:" + pair)! < desktop.events.firstIndex(of: "open:" + target.apps.last!.id)!)
                }
                let missing = populatedDesktop(); missing.dockMissing = true
                do { try switchFocus(target.id, sessions: tf, desktop: missing); assertionFailure("Missing Dock preset should stop") } catch {}
                assert(missing.events.isEmpty, "Dock preflight happens before quitting")
            }
            let switching = FakeDesktop()
            try switchFocus("code", sessions: tf, desktop: switching)
            switching.events = []
            try switchFocus("innovate", sessions: tf, desktop: switching)
            assert(switching.events.filter { $0.hasPrefix("quit:") } == ["quit:cursor"])
            assert(switching.events.last == "url:" + tf[2].timerURL)
            switching.events = []
            try switchFocus("code", sessions: tf, desktop: switching)
            assert(switching.events.filter { $0.hasPrefix("quit:") } == ["quit:codex"])
        }
        print("Focus session scenarios passed: exact five sets, preflight, cancellation, unrelated-app quits, support-app preservation, reselection, remaining-app barrier, launch failure and invalid input")
    }
}
