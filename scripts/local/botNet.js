/** @param {NS} ns */
export async function main(ns) {

	let prevTarget;
	ns.disableLog('getServerMaxRam')

	while (true) {
		const targetList = ns.read("/data/targetList.txt").split(",");
		const rootedHosts = ns.read("/data/rootedHosts.txt").split(",");

		//let target = targetList[0];
		let target = "foodnstuff"
		const fileList = ["/scripts/remote/hack.js", "/scripts/remote/grow.js", "/scripts/remote/weaken.js", "/scripts/remote/weaken2.js"]

		if (target != prevTarget) {
			for (const host of rootedHosts) {
				for (const file of fileList) {
					ns.scp(file, host, "home");
					ns.killall(host);
				}
				ns.print("Scripts updated on ", host);
			}
			let tPrepped = false;
			while (tPrepped == false) {
				if (ns.getServerMaxMoney(target) != ns.getServerMoneyAvailable(target)) {
					ns.tprint("Needs Grow-Weaken");
					await prepGrowWeaken(ns, target);
				}
				else if (ns.getServerMinSecurityLevel(target) != ns.getServerSecurityLevel(target)) {
					ns.tprint("Needs Weaken.");
					await prepWeaken(ns, target)
				}
				if(ns.getServerMaxMoney(target) == ns.getServerMoneyAvailable && ns.getServerMinSecurityLevel(target) == ns.getServerMinSecurityLevel(target)) {
					tPrepped = true;
					ns.print("Prepped.");
				}
			}
		}
		else {
			ns.print("No target change.")
		}
		await ns.sleep(60000);
	}
}
/**  @param {NS} ns */
export async function prepGrowWeaken(ns, target) {
	const rootedHosts = ns.read("/data/rootedHosts.txt").split(",");
	let cashDelta = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target);
	let secDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
	let reqGrowMult = ns.getServerMaxMoney(target) / cashDelta;
	const hostRamArr = [];
	let tHostRam = 0;
	for (const host of rootedHosts) {
		hostRamArr.push([host, ns.getServerMaxRam(host)]);
		tHostRam = tHostRam + ns.getServerMaxRam(host);
	}

	hostRamArr.sort(function (a, b) { return b[1] - a[1]; });

	let bestHostRam = hostRamArr[0][1];

	let gThreads = Math.ceil(1.01 * ns.growthAnalyze(target, reqGrowMult, 1));
	let gSecGain = 0.004 * gThreads;
	let wThreads = Math.ceil((gSecGain + secDelta) / 0.05);

	let pRam = (wThreads + gThreads) * 1.75;

	if (pRam < bestHostRam) {
		ns.print("Only 1 host required. Launching.")
		let wTime = ns.getWeakenTime(target);
		let gTime = ns.getGrowTime(target);
		let pid = ns.exec("/scripts/remote/weaken.js", hostRamArr[0][0], wThreads, 0, target);
		ns.exec("/scripts/remote/grow.js", hostRamArr[0][0], gThreads, wTime - gTime - 100, target);
		while(ns.isRunning(pid,hostRamArr[0][0]))await ns.sleep(100);
	}
	else if (pRam < tHostRam) {
		let gThreadsRemain = gThreads;
		let wThreadsRemain = wThreads;
		let wTime = ns.getWeakenTime(target);
		let gTime = ns.getGrowTime(target);
		let batchesRun = 0;
		while (gThreadsRemain > 0 || wThreadsRemain > 0) {
			for (const host of hostRamArr) {
				if (gThreadsRemain > 0 || wThreadsRemain > 0) {
					let ratio = host[1] / pRam;
					let bgThreads = Math.floor(gThreads * ratio);
					let bwThreads = Math.floor(wThreads * ratio);
					let wTime = ns.getWeakenTime(target);
					let gTime = ns.getGrowTime(target);
					gThreadsRemain = gThreadsRemain - bgThreads
					wThreadsRemain = wThreadsRemain - bwThreads
					ns.exec("/scripts/remote/weaken.js", host[0], bwThreads, 0, target);
					ns.exec("/scripts/remote/grow.js", host[0], bgThreads, wTime - gTime - 100, target)
					await ns.sleep(200);
					batchesRun++
				}
			}
		}
		ns.print("Ran ", batchesRun, " batches. Sleeping ", ((wTime * batchesRun + 10000) / 1000), " seconds.");
		await ns.sleep(wTime * batchesRun + 10000);
	} else {
		ns.print("IMPOSSIBLE. FAILED.")
	}
}
/**  @param {NS} ns */
export async function prepWeaken(ns) {
	const rootedHosts = ns.read("/data/rootedHosts.txt").split(",");
	let secDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
	let wThreads = Math.ceil(secDelta / 0.05);
	let wRam = 1.75 * wThreads;

	const hostRamArr = [];
	let tHostRam = 0;
	for (const host of rootedHosts) {
		hostRamArr.push([host, ns.getServerMaxRam(host)]);
		tHostRam = tHostRam + ns.getServerMaxRam(host);
	}

	hostRamArr.sort(function (a, b) { return b[1] - a[1]; });

	let bestHostRam = hostRamArr[0][1];

	if (pRam < bestHostRam) {
		ns.print("Only 1 host required. Launching.")
		let wTime = ns.getWeakenTime(target);

		let pid = ns.exec("/scripts/remote/weaken.js", hostRamArr[0][0], wThreads, 0, target);
		while (ns.isRunning(pid, hostRamArr[0][0])) await ns.sleep(1000);
	}
	else {
		ns.print("Do more developing.")
	}
}