import * as cbatch from "/scripts/local/cbatch/cbatch-lib.js"
/** @param {NS} ns */
export async function main(ns) {
	//GOALS: ELIMINATE tPrep and batchGen, do everything in launchBatch and launchCheckBatch
	const target = "clarkinc";
	const pHosts = ns.getPurchasedServers();
	const pHostRam = ns.getServerMaxRam(pHosts[0]);
	const delay = 100;
	const port = 10;
	const listenPort = ns.getPortHandle(port);
	listenPort.clear();
	let desiredBatches = ns.args[0];

	const [goalPerc, hostMaxBatches, targetMaxBatches] = cbatch.batchData(ns, target, pHostRam, delay);
	ns.tprint("Aiming for ", goalPerc * 100, "% of target cash per batch.")
	if (typeof (desiredBatches) != "number") {
		ns.tprint("No number of batches entered, using tMax.");
		desiredBatches = targetMaxBatches;
	}

	const ramPool = new Map();
	let serverNum = 0;
	for (const pHost of pHosts) {
		for (let i = 0; i < hostMaxBatches; i++) {
			let batchID = serverNum + "_" + i;
			ramPool.set(batchID.toString(), pHost.toString());
		}
		serverNum++;
	}
	const ramPoolIter = ramPool.entries();

	for (let j = 0; j < desiredBatches; j++) {
		let thisBlock = ramPoolIter.next().value;
		let pHost = thisBlock[1].toString();
		let blockID = thisBlock[0].toString();
		let baseTime = j * (3 * delay);
		cbatch.launchBatch(ns, goalPerc, pHost, target, delay, baseTime, blockID, port)
	}
	ns.write("/debug/cbatch-test-2-debug.txt", "", "w");
	let logNum = 0;
	while (true) {
		await listenPort.nextWrite();
		let cTarget = ns.getServer(target);
		if (cTarget.moneyMax - cTarget.moneyAvailable > 0 || cTarget.hackDifficulty - cTarget.minDifficulty > 0) {
			logNum++
			ns.write("/debug/cbatch-test-2-debug.txt", "------------" + logNum + "------------" + "\n", "a")
			ns.write("/debug/cbatch-test-2-debug.txt", "Batch on block " + listenPort.read() + " finished." + "\n", "a");
			ns.write("/debug/cbatch-test-2-debug.txt", "Target lost " + (cTarget.moneyMax - cTarget.moneyAvailable) + " = " + ((cTarget.moneyAvailable / cTarget.moneyMax) * 100) + "% cash." + "\n", "a");
			ns.write("/debug/cbatch-test-2-debug.txt", "and gained " + (cTarget.hackDifficulty - cTarget.minDifficulty) + " security." + "\n", "a")
		}
		else{listenPort.read()}
	}
}
/** @param {NS} ns */
export function launchBatch(ns, goalPerc, pHost, target, delay, baseTime, blockID, port) {
	const player = ns.getPlayer();
	const vTarget = ns.getServer(target);
	const wStrength = ns.weakenAnalyze(1);

	vTarget.moneyAvailable = vTarget.moneyMax
	vTarget.hackDifficulty = vTarget.minDifficulty;

	let hTime = ns.getHackTime(target);
	let gTime = 3.2 * hTime;
	let wTime = 4 * hTime;

	let hThreads = Math.floor(goalPerc / ns.formulas.hacking.hackPercent(vTarget, player));
	let hSecGain = 0.002 * hThreads;

	vTarget.hackDifficulty = vTarget.minDifficulty+hSecGain
	vTarget.moneyAvailable = vTarget.moneyMax * (1 - goalPerc)

	let gThreads = Math.ceil(1.01*ns.formulas.hacking.growThreads(vTarget, player, vTarget.moneyMax));
	let gSecGain = gThreads * 0.004;
	let tSecGain = hSecGain + gSecGain;

	let wThreads = Math.ceil(1.01 * (tSecGain / wStrength));

	ns.exec("/scripts/remote/hack.js", pHost, hThreads, baseTime + wTime - hTime - (2*delay), target, blockID);
	ns.exec("/scripts/remote/grow.js", pHost, gThreads, baseTime + wTime - gTime - delay, target, blockID);
	ns.exec("/scripts/remote/weaken2.js", pHost, wThreads, baseTime, target, blockID, port);
}
/** @param {NS} ns */
function launchCheckBatch(ns,goalPerc, pHost, target, delay, baseTime, blockID, port) {
	const vTarg = ns.getServer(target);
	const player = ns.getPlayer();
	const wStrength = ns.weakenAnalyze(1, 1);

	if (vTarg.moneyAvailable < vTarg.moneyMax) {
		ns.print(blockID, " was forced to run GW.")
		let ggThreads = Math.ceil(ns.formulas.hacking.growThreads(vTarg, player, vTarg.moneyMax));
		let wgThreads = Math.ceil(1.01 * (((ggThreads * 0.004) + vTarg.hackDifficulty - vTarg.minDifficulty) / wStrength))

		ns.exec("/scripts/remote/weaken2.js", pHost, wgThreads, baseTime, target, blockID, port);
		ns.exec("/scripts/remote/grow.js", pHost, ggThreads, baseTime + wTime - gTime - delay, target, blockID);
		return true;
	}
	else if (vTarg.hackDifficulty > vTarg.minDifficulty) {
		ns.print(blockID, " was forced to run W.")
		let wwThreads = Math.ceil(1.01 * ((vTarg.hackDifficulty - vTarg.minDifficulty) / wStrength));

		ns.exec("/scripts/remote/weaken2.js", pHost, wwThreads, baseTime, target, blockID, port);
		return true;
	}
	else {
		launchBatch(ns,goalPerc,pHost,target,delay,baseTime,blockID,port)
		return false;
	}
}
/** @param {NS} ns */
export function batchData(ns, target, pHostRam, delay) {

	let complete = false;
	let goalPerc = 0.90;
	let player = ns.getPlayer();

	while (complete == false) {
		let vTarget = ns.getServer(target);

		vTarget.moneyAvailable = vTarget.moneyMax
		vTarget.hackDifficulty = vTarget.minDifficulty;

		let wTime = ns.formulas.hacking.weakenTime(vTarget,player);
		let hThreads = Math.floor(goalPerc / ns.formulas.hacking.hackPercent(vTarget, player));
		let hSecGain = hThreads * 0.002;

		vTarget.moneyAvailable = (vTarget.moneyMax * (1 - goalPerc));

		let gThreads = Math.ceil(ns.formulas.hacking.growThreads(vTarget,player,vTarget.moneyMax));
		let gSecGain = gThreads * 0.004;
		let tSecGain = hSecGain + gSecGain;

		let wThreads = Math.ceil(1.01 * (tSecGain / 0.05));

		let bRam = hThreads * 1.7 + ((gThreads + wThreads) * 1.75)

		if (bRam > pHostRam) {
			if (goalPerc > 0.05) {
				goalPerc = goalPerc - 0.05;
			}
			else { ns.tprint("batchGen failed"); return }
		}
		else if (bRam <= pHostRam) {
			let targetMaxBatches = Math.floor(wTime / (3 * delay));
			let hostMaxBatches = Math.floor(pHostRam / bRam);
			complete = true;
			return [goalPerc, hostMaxBatches, targetMaxBatches];
		}
	}
}