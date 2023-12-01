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
		if (cTarget.moneyMax - cTarget.moneyAvailable > 0 || cTarget.hackDifficulty - cTarget.minDifficulty) {
			logNum++
			ns.write("/debug/cbatch-test-2-debug.txt", "------------" + logNum + "------------" + "\n", "a")
			ns.write("/debug/cbatch-test-2-debug.txt", "Batch on block " + listenPort.read() + " finished." + "\n", "a");
			ns.write("/debug/cbatch-test-2-debug.txt", "Target lost " + (cTarget.moneyMax - cTarget.moneyAvailable) + " = " + ((cTarget.moneyAvailable / cTarget.moneyMax) * 100) + "% cash." + "\n", "a");
			ns.write("/debug/cbatch-test-2-debug.txt", "and gained " + (cTarget.hackDifficulty - cTarget.minDifficulty) + " security." + "\n", "a")
		}
		else{listenPort.read()}
	}
}
