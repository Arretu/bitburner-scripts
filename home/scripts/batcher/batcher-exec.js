/** @param {NS} ns */
export async function main(ns) {

	ns.disableLog("sleep");
	ns.disableLog

	//Ffffffff this.
	const pHost = ns.args[0];
	const target = ns.args[1];
	let randArg = ns.args[2];

	//Delay for batches.
	const delay = 500;
	await ns.sleep(200);
	ns.print("Starting batch loops.")


	while (true) {

		//let debugArr = [wTime, gTime, hTime, w1Threads, w2Threads, gThreads, hThreads, concBatch, target,hostName,randArg];
		//ns.print("DEBUG ARRAY: ", [debugArr.toString()]);
		let player = ns.getPlayer();
		//let vTarget = ns.getServer(target);

		let state = await tState(ns, target);
		ns.print("target state = ", state);

		let batchArgs = await getBatchArgs(ns, state, player, target, delay);

		let wTime = batchArgs[0];
		let hTime = batchArgs[1];
		let gTime = batchArgs[2];
		let gThreads = batchArgs[3];
		let w1Threads = batchArgs[4];
		let w2Threads = batchArgs[5];
		let hThreads = batchArgs[6];
		let bTime = batchArgs[7];


		if (state == "ready") {
			// w1
			ns.exec("/scripts/shared/hgw/weaken.js", pHost, parseInt(1.1*w1Threads), 0, target, randArg);


			//w2
			ns.exec("/scripts/shared/hgw/weaken.js", pHost, parseInt(1.1*w2Threads), delay, target, (randArg / 2));

			//Execute hack.
			//delay by weakenTime - growTime - 1000 ms
			ns.exec("/scripts/shared/hgw/hack.js", pHost, hThreads, (wTime - hTime - delay), target, (randArg / 3));

			//Finally, execute grow.
			//delay by weakenTime + 2000 - hTime - 1000
			ns.exec("/scripts/shared/hgw/grow.js", pHost, parseInt(1.1*gThreads), (wTime - gTime + delay - 250), target, (randArg / 4));
		}
		else if (state == "needsGrowWeaken") {
			ns.exec("/scripts/shared/hgw/weaken.js", pHost, w1Threads, 0, target, (randArg));
			ns.exec("/scripts/shared/hgw/grow.js", pHost, gThreads, (wTime - gTime - delay), target, (randArg / 2));
		}
		else if (state == "needsWeaken") {
			ns.exec("/scripts/shared/hgw/weaken.js", pHost, w1Threads, 0, target, (randArg));
		}
		else {
			ns.tprint("No state found when exexuting batch. Killing batcher-exec.")
			return;
		}
		ns.print(state, " batch started. Waiting", Math.round(((bTime/1000)*100))/100," seconds.");
		await ns.sleep(bTime);
		ns.print(state, " batch complete. Waiting 1 second.")
				//Debug
		//ns.tprint("excess security: ", ns.getServerSecurityLevel(target),- ns.getServerMinSecurityLevel(target)," missing cash: ", ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target)); 
		await ns.sleep(1000)
	}
}

//Lets try live target parsing I guess?

/** @param {NS} ns */
async function tState(ns, target) {

	let vTarget = ns.getServer(target);
	let state = [];


	if (vTarget.hackDifficulty == vTarget.minDifficulty) {
		if (vTarget.moneyAvailable == vTarget.moneyMax) {
			state = "ready";
		}
		else {
			state = "needsGrowWeaken";
		}
	}
	else {
		state = "needsWeaken";
	}
	return state;
}

/** @param {NS} ns */
async function getBatchArgs(ns, state, player, target, delay) {
	let vTarget = ns.getServer(target);
	let hTime = ns.formulas.hacking.hackTime(vTarget, player);
	let wTime = hTime * 4;
	let gTime = hTime * 3.2;
	let bTime = wTime;

	


	if (state == "ready") {

		let hThreads = Math.floor(0.9 / ns.formulas.hacking.hackPercent(vTarget,player));

		

		vTarget.moneyAvailable = vTarget.moneyMax /10;
		let gThreads = ns.formulas.hacking.growThreads(vTarget, player, vTarget.moneyMax);

		//Debug
		//ns.tprint("To grow from ", vTarget.moneyAvailable," to ",vTarget.moneyMax," we need ", gThreads," grow threads. hPerc: ",0.9/hThreads);

		let hSecGain = (0.002 * hThreads);
		let gSecGain = (0.004 * gThreads);

		let w1Threads = Math.ceil(hSecGain / 0.05);
		let w2Threads = Math.ceil(gSecGain / 0.05);
		

		bTime = wTime + delay;

		let batchArgs = [wTime, hTime, gTime, gThreads, w1Threads, w2Threads, hThreads, bTime];
		//DEBUG
		//ns.tprint(state, " wTime ", wTime, " hTime ", hTime, " gTime ", gTime, " gThreads ", gThreads, " w1Threads ", w1Threads);
		//ns.tprint(" w2Threads ", w2Threads, " hThreads ", hThreads, " bTime ", bTime);
		return batchArgs;
	}
	else if (state == "needsGrowWeaken") {
		let gThreads = ns.formulas.hacking.growThreads(vTarget, player, vTarget.moneyMax);
		let gSecGain = gThreads * 0.004;
		let secState = vTarget.hackDifficulty - vTarget.minDifficulty;
		let tSecGain = secState + gSecGain;
		let wThreads = Math.ceil(tSecGain / 0.05);
		let batchArgs = [wTime, 0, gTime, gThreads, wThreads, 0, 0, bTime];
		//DEBUG
		//ns.tprint(state, " wTime ", wTime, " hTime ", 0, " gTime ", gTime, " gThreads ", gThreads, " w1Threads ", wThreads);
		//ns.tprint(" w2Threads ", 0, " hThreads ", 0, " bTime ", bTime);
		return batchArgs;
	}
	else if (state == "needsWeaken") {
		let secState = vTarget.hackDifficulty - vTarget.minDifficulty;
		let wThreads = Math.ceil(secState / 0.05);
		let batchArgs = [wTime, 0, 0, 0, wThreads, 0, 0, bTime];
		//DEBUG
		//ns.tprint(state, " wTime ", wTime, " hTime ", hTime, " gTime ", gTime, " gThreads ", 0, " w1Threads ", wThreads);
		//ns.tprint(" w2Threads ", 0, " hThreads ", 0, " bTime ", bTime);
		return batchArgs;
	} else {
		ns.tprint("Could not generate batch args. Something went wrong.");
		return;
	}

}