/** @param {NS} ns */
export async function main(ns) {

	const allServers = ns.read("/data/static/npcHosts.txt").split(",");
	const rootedServers = [];

	let allRooted = false;

	while (allRooted == false) {

		const toolSet = toolCheck(ns);
		await ns.sleep(20);
		const penStrength = toolSet.length;

		for (const server of allServers) {

			if (ns.hasRootAccess(server) == false) {
				let serverStrength = ns.getServerNumPortsRequired(server);
				if (penStrength >= serverStrength) {
					for (i = 0; i < serverStrength; i++) {
						const nextTool = toolSet[i];
						if (nextTool = "ssh") {
							ns.brutessh(server);
						}
						else if (nextTool = "ftp") {
							ns.ftpcrack(server);
						}
						else if (nextTool = "smtp") {
							ns.relaysmtp(server);
						}
						else if (nextTool = "http") {
							ns.httpworm(server);
						}
						else if (nextTool = "sql") {
							ns.sqlinject(server);
						}
					}
					ns.nuke(target);
					rootedServers.push(server);
					ns.tprint(server," rooted.")
				}
			}
			else {
				rootedServers.push(server);
				ns.print(server," already rooted.")
			}
		}
		if (rootedServers.length == allServers.length) {
			ns.tprint("ALL SERVERS ROOTED");
			allRooted = true;
		}
		ns.write("/data/rootedHosts.txt",rootedServers.toString(),"w");
		await ns.sleep(60000);
	}
}
/** @param {NS} ns */
function toolCheck(ns) {
	const tools = [];
	if (ns.fileExists("BruteSSH.exe", "home") == true) {
		tools.push("ssh");
	}
	if (ns.fileExists("FTPCrack.exe", "home") == true) {
		tools.push("ftp");
	}
	if (ns.fileExists("relaySMTP.exe", "home") == true) {
		tools.push("smtp");
	}
	if (ns.fileExists("HTTPWorm.exe", "home") == true) {
		tools.push("http");
	}
	if (ns.fileExists("SQLInject.exe", "home") == true) {
		tools.push("sql");
	}
	return tools;
}