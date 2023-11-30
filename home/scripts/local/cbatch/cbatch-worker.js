/** @param {NS} ns */
export async function main(ns) {
	const [target, pHosts, pHostRam, delay, port] = [ns.args[0], ns.args[1].split(","), ns.args[2], ns.args[3], ns.args[4]]
	const lPort = ns.getPortHandle(port);
	let hackChange = true;
	let target2, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, hostMaxBatches, targetMaxBatches, cachedHackLevel;
	const debugString = "/debug/worker-" + (port - 10) + "-log.txt";
	let ramPool, ramPoolInc;
	let targetBatches;
	let hackLevel;

	ns.disableLog('sleep')


	while (true) {

		if (hackChange == true) {

			for (const host of pHosts) {
				ns.killall(host);
			}

			await tPrep(ns, target, pHosts[0]);

			[target2, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, hostMaxBatches, targetMaxBatches] = batchGen(ns, target, pHostRam, delay);
			ramPool = genRamPool(ns, pHosts, hostMaxBatches);
			ramPoolInc = ramPool.entries();
			cachedHackLevel = ns.getHackingLevel();
			if (ramPool.size < targetMaxBatches) {
				targetBatches = ramPool.size - 1;
				ns.print("Reducing batchcount to fit Rampool, now: ", targetBatches)
			} else {
				targetBatches = targetMaxBatches;
				ns.print("Aiming for ", targetBatches, " batches.")
			}
			ns.write(debugString, targetBatches + " target batches." + "\n", "w");
			for (let i = 0; i < targetBatches; i++) {
				let nextBlock = ramPoolInc.next().value;
				let baseTime = i * delay * 4;
				launchBatch(ns, nextBlock[1], target, delay, baseTime, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, nextBlock[0], port);
				ns.write(debugString, "launched batch " + i + " on " + nextBlock[0] + "\n", "a");
			}
			await ns.sleep(10);
			hackChange = false;
		}
		ns.write(debugString, "Initial batchSet launched." + "\n", "a")
		ns.print("Waiting for listenport activity.");
		await lPort.nextWrite()
		hackLevel = ns.getHackingLevel();
		if (ns.getHackingLevel() != cachedHackLevel) {
			hackChange = true;
		}
		let blockID = lPort.read();
		await tPrep(ns, target, ramPool.get(blockID))
		launchBatch(ns, ramPool.get(blockID), target, delay, 0, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, blockID, port);
		ns.print("Replacement batch launched.")
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
	ns.exec("/scripts/remote/weaken.js", pHost, w1Threads, baseTime, target, batchID);
	ns.exec("/scripts/remote/hack.js", pHost, hThreads, baseTime + wTime - hTime - delay, target, batchID);
	ns.exec("/scripts/remote/weaken2.js", pHost, w2Threads, baseTime + (2 * delay), target, batchID, port);
	ns.exec("/scripts/remote/grow.js", pHost, gThreads, baseTime + wTime - gTime + delay, target, batchID);
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
			//let pHostsNeeded = Math.ceil(targetMaxBatches / hostMaxBatches);
			complete = true;
			ns.print("DEBUG - BatchGenArgs-targeMaxBatches/hostMaxBatches: ", targetMaxBatches, " / ", hostMaxBatches)
			return [target, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, hostMaxBatches, targetMaxBatches];
		}
	}
}
/** @param {NS} ns */
async function tPrep(ns, target, pHost) {
	if (ns.getServerMaxMoney(target) == ns.getServerMoneyAvailable(target) && ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target)) {
		return true;
	}
	else {
		const vTarg = ns.getServer(target);
		const player = ns.getPlayer();
		let prepped = false;

		while (prepped == false) {
			ns.print("Prep not complete. Cycling.")
			let pid;
			if (ns.getServerMaxMoney(target) != ns.getServerMoneyAvailable(target)) {
				ns.print("Running GW")
				let pgThreads = Math.ceil(ns.formulas.hacking.growThreads(vTarg, player, vTarg.moneyMax, 1));
				let gSecGain = pgThreads * 0.004;
				let secDelta = vTarg.hackDifficulty - vTarg.minDifficulty;
				let tSecDelta = secDelta + gSecGain;
				let pwThreads = Math.ceil(tSecDelta / 0.05);
				let pwTime = ns.formulas.hacking.weakenTime(vTarg, player);
				let pgTime = ns.formulas.hacking.growTime(vTarg, player);

				ns.exec("/scripts/remote/grow.js", pHost, pgThreads, pwTime - pgTime - 50, target)
				pid = ns.exec("/scripts/remote/weaken.js", pHost, pwThreads, 0, target)

				while (ns.isRunning(pid, pHost)) await ns.sleep(100);

			}
			else if (ns.getServerSecurityLevel(target) != ns.getServerMinSecurityLevel(target)) {
				ns.print("Running W.")
				let secDelta = vTarg.hackDifficulty - vTarg.minDifficulty;
				let pwThreads = Math.ceil(secDelta / 0.05);
				let pwTime = ns.formulas.hacking.weakenTime(vTarg, player);
				pid = ns.exec("/scripts/remote/weaken.js", pHost, pwThreads, 0, target)
				while (ns.isRunning(pid, pHost)) await ns.sleep(100);

			}
			if (ns.getServerMaxMoney(target) == ns.getServerMoneyAvailable(target) && ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target)) {
				prepped = true;
			}
			
			await ns.sleep(100);
		}
	}
	return true;
}