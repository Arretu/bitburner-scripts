import { tPrep, formFlag, batchArgs, batchArgsF, getHosts, getMinRam, execHGW } from "/scripts/local/lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep');
	ns.disableLog('exec')
	ns.disableLog('getServerMaxRam');
	ns.disableLog('getServerUsedRam')
	ns.disableLog('scp');
	ns.disableLog('getServerSecurityLevel')
	ns.disableLog('getServerMaxMoney')
	ns.tail();
	await ns.sleep(500);
	while (true) {
		const targetList = ns.read("/data/targetList.txt").split(",")
		const target = targetList[0];
		await bBatch(ns, target);
		await ns.sleep(100000);
	}
}
/** @param {NS} ns */
async function bBatch(ns, target) {
	const pHosts = getHosts(ns);
	const minRAM = getMinRam(ns, pHosts)
	await tPrep(ns, pHosts, target, minRAM);
	let hThreads, gThreads, wThreads, bRam
	//Get batchArgs
	if (formFlag(ns)) {
		ns.tprint("Has Formulas.")
		[hThreads, gThreads, wThreads, bRam] = batchArgsF(ns, target, minRAM)
	}
	else {
		ns.tprint("No Formulas.")
		[hThreads, gThreads, wThreads, bRam] = batchArgs(ns, target, minRAM)
	}
	//Preload variables.
	const hTime = ns.getHackTime(target);
	const hDelay = 3 * hTime;
	const gDelay = 0.8 * hTime;
	//Start Batching.
	let pid;
	let lastHost;
	ns.print("Caching starttime.")
	await ns.sleep(10);
	let cachedTime = Date.now();
	for (const pHost of pHosts) {
		lastHost = pHost
		let thisHostBatches = Math.floor(ns.getServerMaxRam / bRam)
		if (Date.now() > cachedTime + 400) {
			await ns.sleep(50)
		}
		for (let i = 0; i < thisHostBatches; i++) {
			pid = execHGW(ns, pHost, hDelay, hThreads, gDelay, gThreads, wThreads, target)
		}
	}
	ns.tprint("Waiting for pid-" + pid + " on " + lastHost)
	while (ns.isRunning(pid, lastHost)) {
		await ns.sleep(100);
	}
	return true;
}