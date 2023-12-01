/** @param {NS} ns */
export async function main(ns) {
	//The init script of the continuous batcher. Listens for target updates and restarts cbatch as needed.
	const targetUpdatePort = ns.getPortHandle(1);
	const fileList = ["/scripts/remote/hack.js", "/scripts/remote/grow.js", "/scripts/remote/weaken.js", "/scripts/remote/weaken2.js"]

	while (true) {
		const pHosts = ns.getPurchasedServers();
		const targetList = ns.read("/data/targetList.txt").split(",");

		ns.scriptKill("/scripts/local/cbatch-exec.js", "home");
		for (const pHost of pHosts) {
			ns.killall(pHost);
			for (const file of fileList) {
				ns.scp(file, pHost, "home");
			}
		}
		ns.run("/scripts/local/cbatch/cbatch-exec.js", 1,targetList.toString(),pHosts.toString());
		await targetUpdatePort.nextWrite();
	}
}