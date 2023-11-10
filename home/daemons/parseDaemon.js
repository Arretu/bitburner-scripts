import { earlyTarget } from "/scripts/shared/libs/earlyTarget.js";
import { advTarget } from "/scripts/shared/libs/advTarget.js";
import { hasFormulas } from "/scripts/shared/libs/libFlags.js";
/** @param {NS} ns */
export async function main(ns) {

	//Prevent log spam
	ns.disableLog("disableLog");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerMaxRam");

	while (true) {
		let formFlag = await hasFormulas(ns);
		await updateServerData(ns);


		//Generate current best 5 targets (currenttargets.txt) based on whether we have formulas or not.
		//Do we have formulas? No, we don't.
		if (formFlag == false) {
			ns.print("Debug No Formulas")
			await earlyTarget(ns, 'w');
			//Debug below
			//let best5 = await earlyTarget(ns,'w');
			//ns.print("Debug ",best5.toString());
		}

		//Yes, we have formulas. 
		else if (formFlag == true) {
			ns.print("Debug Has Formulas")
			let best5 = await advTarget(ns,'w');
			//Debug
			//ns.print(best5.toString());
		} else {
			ns.print("DEBUG THE formulas.exe flag is fucked again.")
		}
		//Snooze for 5 minutes.
		await ns.sleep(5 * 60000)
	}
}

/** @param {NS} ns */
async function updateServerData(ns) {

	const allNPC = ns.read("/data/static/allnpc.txt").split(",");
	const allTargets = ns.read("/data/static/alltargets.txt").split(",");
	let allRooted = [];
	let validHosts = [];
	let possibleTargets = [];
	let playerHackLevel = ns.getHackingLevel();

	//Generate allrooted.txt - list of all NPC servers with root access.
	for (const host of allNPC) {
		if (ns.hasRootAccess(host) == true) {
			allRooted.push(host);
		}
	}
	ns.mv("home", "/data/allrooted.txt", "/data/old/allrooted.txt");
	await ns.sleep(500);
	ns.write("/data/allrooted.txt", allRooted.toString());


	//Generate validhosts.txt - rooted servers with RAM > 0
	for (const host of allRooted) {
		
			if (ns.getServerMaxRam(host) > 0) {
				validHosts.push(host);
			
		}
	}
	ns.mv("home", "/data/validhosts.txt", "/data/old/validhosts.txt");
	await ns.sleep(500);
	ns.write("/data/validhosts.txt", validHosts.toString());


	//Generate possibletargets.txt - rooted servers with hacklevel < playerhacklevel
	for (const target of allTargets) {
		if (ns.getServerRequiredHackingLevel(target) < playerHackLevel) {
			if (ns.hasRootAccess(target) == true) {
				possibleTargets.push(target);
			}
		}
	}
	ns.mv("home", "/data/possibletargets.txt", "/data/old/possibletargets.txt");
	await ns.sleep(500);
	ns.write("/data/possibletargets.txt", possibleTargets.toString());


}
