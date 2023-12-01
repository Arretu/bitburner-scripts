/** @param {NS} ns */
export async function main(ns) {

	const target = "clarkinc";
	const pHosts = ns.getPurchasedServers();
	const pHostRam = ns.getServerMaxRam(pHosts[0]);
	const delay = 100;
	const port = 10;
	const listenPort = ns.getPortHandle(port);
	listenPort.clear();

	ns.disableLog('exec');
	ns.disableLog('sleep');

	//Make sure server is prepped.
	await tPrep(ns, target, pHosts[0]);

	let [w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, hostMaxBatches, targetMaxBatches] = batchGen(ns, target, pHostRam, delay);

	const ramPool = genRamPool(ns, pHosts, hostMaxBatches);
	const ramPoolIter = ramPool.entries();

	for (let i = 0; i <= targetMaxBatches; i++) {
		let baseTime = i * (4 * delay);
		let thisBlock = ramPoolIter.next().value;
		let batchID = thisBlock[0];
		launchBatch(ns, thisBlock[1], target, delay, baseTime, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, batchID, port);
	}
	ns.write("/debug/cbatch-test.txt", "", "w");
	let count = 0
	const vTarget = ns.getServer(target);
	while (true) {
		ns.print("Waiting for port activity.")
		await listenPort.nextWrite();
		let blockID = listenPort.read();
		ns.write("/debug/cbatch-test.txt", "Batch on block: " + listenPort.read() + " complete. \n", "a");
		ns.write("/debug/cbatch-test.txt", "Target status: missing " + (vTarget.moneyMax - ns.getServerMoneyAvailable(target)) + " cash and has " + (ns.getServerSecurityLevel(target) - vTarget.minDifficulty) + " excess security. \n", "a");
		launchBatch(ns, ramPool.get(blockID), target, delay, 0, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, blockID, port);
	}
}
/** @param {NS} ns */
function genRamPool(ns, pHosts, hostMaxBatches) {
	const ramMap = new Map();
	let serverNum = 0;
	for (const pHost of pHosts) {
		for (let i = 0; i < hostMaxBatches; i++) {
			let batchID = serverNum + "-" + i;
			ramMap.set(batchID.toString(), pHost.toString());
		}
		serverNum++;
	}
	ns.print("Rampool Generated. ", ramMap.size, " total blocks.")
	return ramMap;
}
/** @param {NS} ns */
function launchBatch(ns, pHost, target, delay, baseTime, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, batchID, port) {
	const vTarg = ns.getServer(target);
	const player = ns.getPlayer();
	if (vTarg.moneyAvailable != vTarg.moneyMax) {
		ns.print(batchID, " was forced to run GW.")
		let ggThreads = Math.ceil(ns.formulas.hacking.growThreads(vTarg, player, vTarg.moneyMax));
		let wgThreads = Math.ceil(1.01 * (((gThreads * 0.004) + vTarg.hackDifficulty - vTarg.minDifficulty) / 0.05))

		ns.exec("/scripts/remote/weaken2.js", pHost, wgThreads, baseTime, target, batchID, port);
		ns.exec("/scripts/remote/grow.js", pHost, ggThreads, baseTime + wTime - gTime - delay, target, batchID);
	}
	else if (vTarg.minDifficulty != vTarg.hackDifficulty) {
		ns.print(batchID, " was forced to run W.")

		let wwThreads = Math.ceil(1.01 * ((vTarg.hackDifficulty - vTarg.minDifficulty) / 0.05));
		ns.exec("/scripts/remote/weaken2.js", pHost, wwThreads, baseTime, target, batchID, port);
	}
	else {
		ns.print(batchID," relaunched.")
		ns.exec("/scripts/remote/weaken.js", pHost, w1Threads, baseTime, target, batchID);
		ns.exec("/scripts/remote/hack.js", pHost, hThreads, baseTime + wTime - hTime - delay, target, batchID);
		ns.exec("/scripts/remote/weaken2.js", pHost, w2Threads, baseTime + (2 * delay), target, batchID, port);
		ns.exec("/scripts/remote/grow.js", pHost, gThreads, baseTime + wTime - gTime + delay, target, batchID);
	}
}

/** @param {NS} ns */
function batchGen(ns, target, pHostRam, delay) {
	const player = ns.getPlayer();
	const vTarget = ns.getServer(target);
	let complete = false;
	let goalPerc = 0.90;


	while (complete == false) {

		vTarget.moneyAvailable = vTarget.moneyMax * (1 - goalPerc);
		vTarget.hackDifficulty = vTarget.minDifficulty;

		let gThreads = Math.ceil(1.01 * (ns.formulas.hacking.growThreads(vTarget, player, vTarget.moneyMax, 1)));
		let w1Threads = Math.ceil(1.01 * ((gThreads * 0.004) / 0.05));

		vTarget.moneyAvailable = vTarget.moneyMax;
		let hThreads = Math.ceil(1.01 * (goalPerc / ns.formulas.hacking.hackPercent(vTarget, player)))
		let w2Threads = Math.ceil(1.01 * ((hThreads * 0.002) / 0.05));

		let bRam = (1.75 * (gThreads + w1Threads + w2Threads)) + (1.7 * hThreads);

		if (bRam > pHostRam) {
			if (goalPerc > 0.05) {
				goalPerc = goalPerc - 0.05;
				ns.tprint("Reducing goal, now: ", goalPerc)
			}
			else { ns.tprint("batchGen failed"); return }
		}
		else if (bRam <= pHostRam) {
			let hTime = ns.formulas.hacking.hackTime(vTarget, player);
			let wTime = 4 * hTime;
			let gTime = 3.2 * hTime;
			let targetMaxBatches = Math.floor(wTime / (4 * delay));
			let hostMaxBatches = Math.floor(pHostRam / bRam);
			complete = true;
			return [w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, hostMaxBatches, targetMaxBatches];
		}
	}
}
/** @param {NS} ns */
async function tPrep(ns, target, pHost) {

	let prepDone = false;
	let pid;

	while (prepDone == false) {
		let prepTarg = ns.getServer(target);
		let cashDelta = prepTarg.moneyMax - prepTarg.moneyAvailable;
		let secDelta = prepTarg.hackDifficulty - prepTarg.minDifficulty;

		ns.print(cashDelta, " | ", secDelta)

		if (cashDelta > 0) {
			ns.print(target, " requires growing.");
			let pgThreads = Math.ceil(1.01 * ns.formulas.hacking.growThreads(prepTarg, player, prepTarg.moneyMax, 1));
			let gSecGain = pgThreads * 0.004;
			let tSecDelta = secDelta + gSecGain;
			let pwThreads = Math.ceil(1.01 * (tSecDelta / 0.05));
			let pwTime = ns.formulas.hacking.weakenTime(prepTarg, player);
			let pgTime = ns.formulas.hacking.growTime(prepTarg, player);

			ns.exec("/scripts/remote/grow.js", pHost, pgThreads, pwTime - pgTime - 50, target)
			pid = ns.exec("/scripts/remote/weaken.js", pHost, pwThreads, 0, target)
			while (ns.isRunning(pid, pHost)) await ns.sleep(100);
		}
		else if (secDelta > 0) {
			ns.print(target, " requires weakening. secDelta: ", secDelta)
			let pwThreads = Math.ceil(secDelta / 0.05);

			pid = ns.exec("/scripts/remote/weaken.js", pHost, pwThreads, 0, target)
			while (ns.isRunning(pid, pHost)) await ns.sleep(100);
		}
		else { prepDone = true; await ns.sleep(100) }
	}
}