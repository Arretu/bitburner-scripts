/** @param {NS} ns */
export async function main(ns) {
	const targetList = ns.args[0].split(",")
	const pHosts = ns.args[1].split(",")
	const delay = 100;

	const pHostRam = ns.getServerMaxRam(pHosts[0]);

	const tBatchDataArr = [];

	let ramPoolFull = false;
	let freeHosts = pHosts.length;
	ns.tprint(freeHosts, " free Hosts.")

	//See how many servers we can saturate.
	let j = 0;
	while (ramPoolFull == false) {
		let [target, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, pHostsNeeded] = batchGen(ns, targetList[j], pHostRam, delay);
		if (freeHosts - pHostsNeeded >= 0) {
			freeHosts = freeHosts - pHostsNeeded;
			tBatchDataArr.push([target, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, pHostsNeeded]);
			j++
		}
		else { ramPoolFull = true; }
	}
	/*
		for(const batchSet of tBatchDataArr) {
			ns.write("/debug/cbatch-exec-debug.txt","\n","a");
		}
	*/
	//ns.tprint(tBatchDataArr.toString())
	ns.write("/debug/cbatch-exec-debug.txt", "target, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, pHostsNeeded \n", "w");

	//Split up pHosts for each and exec a worker.
	let k = 0;
	let l = 0;
	const pidArr = [];
	for (const batchSet of tBatchDataArr) {
		const assignedPhosts = [];
		//ns.tprint(batchSet.toString())
		ns.write("/debug/cbatch-exec-debug.txt", batchSet.toString() + "\n", "a");
		let pHostsNeeded = batchSet[8]
		for (let i = 0; i < pHostsNeeded; i++) {
			assignedPhosts.push(pHosts[l]);
			l++
		}
		ns.run("/scripts/local/cbatch/cbatch-worker.js", 1, batchSet[0], assignedPhosts.toString(), pHostRam, delay, k + 10)
		ns.tprint("Worker ",k," started with hosts: ",assignedPhosts.toString(), " | listening on port ",k+10)
		k++;
	}
	// Main Controller.



}
/** @param {NS} ns */
export function batchGen(ns, target, pHostRam, delay) {
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
			let pHostsNeeded = Math.ceil(targetMaxBatches / hostMaxBatches);
			complete = true;
			//ns.tprint("DEBUG - BatchGenArgs: ",target, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, " | ",pHostsNeeded)
			return [target, w1Threads, w2Threads, gThreads, hThreads, wTime, gTime, hTime, pHostsNeeded];
		}
	}
}