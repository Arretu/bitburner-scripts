/** @param {NS} ns */
export async function main(ns) {

	//Generates static lists at the start of each game.
	const allNPC = [];

	const allTargets = [];
	const filtered = ['home'];
	const pServerNames = ns.getPurchasedServers();

	const allPersonal = filtered.concat(",",pServerNames);
	const allServerNames = ns.read("/data/static/allservers.txt").split(",");

	//Generate allnpc.txt List of non personal or filtered servers.
	for (const host of allServerNames) {

		ns.print("Debug: ", host)

		if (allPersonal.indexOf(host) === -1) {
			allNPC.push(host);
		}
	}
	ns.write("/data/static/allnpc.txt", allNPC.toString());
	await ns.sleep(1000);

	

	//Generate alltargets.txt - allnpc.txt without servers with 0 max money.
	for (const host of allNPC) {

		if (ns.getServerMaxMoney(host) > 0) {
			allTargets.push(host);
		}
	}
	ns.write("/data/static/alltargets.txt", allTargets.toString());
	await ns.sleep(1000);

	//Generate remotehosts.txt - allnpc without 0RAM servers and have root access.
	//for (const rhost of allNPC) {

	//	if (ns.getServerMaxRam(rhost) > 0) {
	//		if (ns.hasRootAccess(rhost) == true) {
	//			remoteHosts.push(rhost);
	//		}
	//	}
	//}
	//ns.write("/data/remotehosts.txt", remoteHosts.toString());

}


