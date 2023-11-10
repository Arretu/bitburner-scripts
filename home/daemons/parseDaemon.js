/** @param {NS} ns */
export async function main(ns) {

	//Prevent log spam
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerMaxRam");
	

	//Generates and updates non static lists (ones affected by hacking levels etc.) Updates every X minutes.
	while (true) {

		//At start of loop update variables.
		//const pServers = ns.getPurchasedServers();
		const allNPC = ns.read("/data/static/allnpc.txt").split(",");
		const allTargets = ns.read("/data/static/alltargets.txt").split(",");
		let currTargets = [];
		const top5targets = [];
		const allRooted = [];
		const validHosts = [];
		//const remoteHosts = ns.read("/data/remotehosts.txt").split(",");
		const possibleTargets = [];
		let playerHackLevel = ns.getHackingLevel();
		let hasFormulas = ns.fileExists("Formulas.exe", "home");

		//Wipe files
		ns.write("/data/allrooted.txt", "", "w");
		ns.write("/data/possibletargets.txt", "", "w");
		ns.write("/data/currtargets.txt", "", "w");
		ns.write("/data/validhosts.txt", "", "w");
		await ns.sleep(1000);

		//Generate allrooted.txt - list of all NPC servers with root access.
		for (const host of allNPC) {
			if (ns.hasRootAccess(host) == true) {
				allRooted.push(host);
			}
		}
		ns.write("/data/allrooted.txt", allRooted.toString());
		await ns.sleep(1000);

		//Generate validhosts.txt - rooted servers with RAM > 0
		for (const host of allRooted) {
			if (ns.hasRootAccess(host) == true) {
				if (ns.getServerMaxRam(host) > 0) {
					validHosts.push(host);
				}
			}
		}
		ns.write("/data/validhosts.txt", validHosts.toString());
		await ns.sleep(1000);






		//Generate possibletargets.txt - alltargets without servers higher than our hacking level or without root access.
		for (const target of allTargets) {
			if (ns.getServerRequiredHackingLevel(target) < playerHackLevel) {
				if (ns.hasRootAccess(target) == true) {
					possibleTargets.push(target);


				}
			}
		}
		ns.write("/data/possibletargets.txt", possibleTargets.toString());

		//Debug
		//ns.tprint("HasFormulasFlag", hasFormulas);
		//ns.tprint("pre target scan", possibleTargets.toString());

		//Generate current best 5 targets (currenttargets.txt) based on whether we have formulas or not.
		//Do we have formulas? No, we don't.
		if (hasFormulas == false) {
			const possibleTargets = ns.read("/data/possibletargets.txt").split(",");
			//Debug
			//ns.tprint("NOFORMULAS")

			for (const target of possibleTargets) {
				if ((playerHackLevel / 3) > ns.getServerRequiredHackingLevel(target)) {
					//ns.tprint("DEBUG: target: ",target);

					//score target and add to new array
					const thisTarget = [target, Math.floor(ns.getServerMaxMoney(target) / ns.getWeakenTime(target))];
					//ns.tprint("DEBUG thistarget: ", thisTarget.toString());
					currTargets.push(thisTarget);
				}
			}
			ns.print("DEBUG: current targs: ",currTargets.toString());
		}

		//Yes, we have formulas. 
		else if (hasFormulas == true) {


			let player = ns.getPlayer();

			for (const target of possibleTargets) {

				if (playerHackLevel > ns.getServerRequiredHackingLevel(target)) {



					let serverInfo = ns.getServer(target);
					serverInfo.hackDifficulty = ns.getServerMinSecurityLevel(target);
					serverInfo.moneyAvailable = ns.getServerMaxMoney(target);

					let hackChance = ns.formulas.hacking.hackChance(serverInfo, player);
					if (hackChance > 0.9) {

						//Hacking Analysis
						let hackPercent = ns.formulas.hacking.hackPercent(serverInfo, player);
						let hackThreadsNeeded = Math.floor(50 / hackPercent);

						//Debug
						//ns.tprint("DEBUG: ",serverInfo.hostname, " requires ", hackThreadsNeeded, " hacking threads for 50% money");

						let hackSecGain = ns.hackAnalyzeSecurity(hackThreadsNeeded, serverInfo.hostname);
						//ns.tprint(hackSecGain, " hack sec gain")

						let hackValue = serverInfo.moneyMax / 2;

						//Growth Analysis
						serverInfo.moneyAvailable = (serverInfo.moneyMax / 2);

						//ns.tprint("DEBUG ", serverInfo.hostname, " has ", serverInfo.moneyAvailable, " of ", serverInfo.moneyMax, " cash.");

						let growThreadsNeeded = Math.ceil(ns.formulas.hacking.growThreads(serverInfo, player, serverInfo.moneyMax));

						//ns.tprint("DEBUG ", serverInfo.hostname, " needs ", growThreadsNeeded, " grow threads to recover fully");

						let growSecGain = ns.growthAnalyzeSecurity(growThreadsNeeded, serverInfo.hostname);
						//ns.tprint(growSecGain, " grow security gain");

						//Pick the larger of hack sec gain and grow sec gain.
						let sumSecGain = hackSecGain + growSecGain;

						//ns.tprint("DEBUG: ",sumSecGain, " total sec gain")

						//Weaken Analysis
						serverInfo.hackDifficulty = serverInfo.minDifficulty + sumSecGain;
						let tWeakenTime = (ns.getWeakenTime(serverInfo.hostname) / 1000);
						let weakenStrength = ns.weakenAnalyze(1);
						let weakenThreads = sumSecGain / weakenStrength;
						//ns.tprint("DEBUG ", serverInfo.hostname, " needs ", weakenThreads, " weaken threads in ", tWeakenTime," seconds");

						//Lets do some maths? Wtf is going on.
						let targetScore = (hackValue / tWeakenTime);

						//Debug
						//ns.tprint(target);
						//ns.tprint("DEBUG: ",serverInfo.hostname, " generates ", targetScore, "$/s");

						const thisTarget = [target, targetScore];
						currTargets.push(thisTarget);

						//Debug
						//ns.tprint("from curr targ", currTargets.toString());
						//ns.tprint(serverInfo.hostname," yields ", hackValue, " money in ", tWeakenTime, " seconds with",growThreadsNeeded," ", hackThreadsNeeded ," g w threads ",);
						//ns.tprint(growSecGain, " grow sec gain ", hackSecGain, " hack sec gain.")
					}
				}
			}
			ns.print(currTargets.toString());
		}

		//sort list by highest score
		currTargets.sort(function (a, b) {
			return b[1] - a[1];
		})

		for (const host of currTargets[0]) {
			//ns.print("DEBUG: ")
			for (let i = 0; i <= 5; i++) {
				top5targets.push(currTargets[i][0]);
				//ns.print(currTargets[i]);
			}

			ns.print("DEBUG Sorted targs:",top5targets.toString());

			ns.write("/data/currtargets.txt", top5targets.toString());

			//Sleep for 15 minutes.
			await ns.sleep(120000);

		}
	}
}
