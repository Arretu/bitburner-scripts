/** @param {NS} ns */
import { pull, getRandArg } from "/scripts/shared/libs/lib.js";

/** @param {NS} ns */
export async function main(ns) {



	//Constants
	const argSet = ns.args[0].split(",");
	let hostName = argSet[0];
	let groupNum = argSet[1];
	let hostRAM = argSet[2];
	const activeGroup = ns.read("/data/batcher/activeGroup.txt").split(",");

	//Debug
	//ns.tprint("hostname ", hostName, " groupNum ", groupNum, " hostRAM ", hostRAM);
	//ns.tprint(activeGroup.toString());




	while (true) {

		//Pull new target list.
		await pull(ns, "/data/currtargets.txt", hostName);
		await ns.sleep(1000);


		//Data for target prioty change check.
		let currTargets = ns.read("/data/currtargets.txt").split(",");
		let oldTargets = ns.read("/data/old/currtargets.txt").split(",");

		if (currTargets[groupNum] != oldTargets[groupNum]) {

			let target = currTargets[groupNum];//.toString();
			ns.print("New target priorities detected. Prepping target ", target);
			

			//Prep Target - this bit is not batched yet.
			let tPrep = false;
			while (tPrep == false) {

				await ns.sleep(100);

				if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {

					

					for (const host of activeGroup) {
						//ns.tprint("DEBUG ahost ", ahost);
						let randArg = await getRandArg(ns);
						let threads = Math.floor((hostRAM / 1.75) - 100);

						
						ns.exec("/scripts/shared/hgw/weaken.js", host, threads, target, 100, randArg);
						await ns.sleep(100);
					}
				} else if (ns.getServerMaxMoney(target) > ns.getServerMoneyAvailable(target)) {
					for (const host of activeGroup) {
						let randArg = await getRandArg(ns);
						let threads = Math.floor((hostRAM / 1.75) - 100);
						ns.exec("/scripts/shared/hgw/grow.js", host, threads, target, 100, randArg);
						await ns.sleep(100);
					}
				} else {
					tPrep = true;
					await ns.sleep(100);
					ns.tprint("Target Prepped.")
				}
			}
			
			//Target is prepped. Time to generate the batch values we need.
			



		} else {
			//sleep for 15 minutes.
			await ns.sleep(15 * 60 * 1000);
		}




		return;




	}

}
/** @param {NS} ns */
async function batchGen(ns, target, hostRAM) {

	//HWGW
	//Make virtual player and server,
	let player = ns.getPlayer();
	let targetInfo = ns.getServer(target);

	//Find max threads possible on each host.
	let hSize = ns.getScriptRam("/scripts/shared/hgw/hack.js", "node-6");
	let gwSize = ns.getScriptRam("/scripts/shared/hgw/weaken.js", "node-6");
	let maxhThreads = Math.floor(hostRAM / hSize);
	let maxgwThreads = Math.floor(hostRAM / gwSize);


	//Set virtual server to Max money and min security.
	targetInfo.moneyAvailable = 0;
	targetInfo.hackDifficulty = ns.getServerMinSecurityLevel(target);

	//How many growthreads for 100% money.
	let gThreadsneeded = ns.formulas.hacking.growThreads(targetInfo, player, ns.getServerMaxMoney(target), 1);
	//Debug
	ns.tprint(gThreadsneeded);

	//How many hacking threads needed to hack 100% of Max Money?
	let hThreads100 = Math.floor(1 / ns.formulas.hacking.hackPercent(targetInfo, player));
	let hSecLoss = ns.formulas.hacking.



		//Debug
		ns.tprint("Debug Hacking Threads for 100% - ", hThreads100, " max threads ",);






	return


}