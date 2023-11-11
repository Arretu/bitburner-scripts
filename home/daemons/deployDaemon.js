/** @param {NS} ns */
import { hasFormulas } from "/scripts/shared/libs/libFlags.js";
/** @param {NS} ns */
export async function main(ns) {

	//and shut up about shutting up
	ns.disableLog('disableLog');
	//Oh my god shut up.
	ns.disableLog('getServerMaxMoney');
	ns.disableLog('getServerMaxRam');
	ns.disableLog('scp');
	ns.disableLog('exec');
	ns.disableLog('killall');
	ns.disableLog('getServerMinSecurityLevel');
	ns.disableLog('sleep');

	let batcherTime = false;




	while (batcherTime == false) {
		let currTargets = ns.read("/data/currtargets.txt").split(",");
		let prevTargets = ns.read("/data/old/currenttargets.txt").split(",");

		if (currTargets[0] != prevTargets[0]) {

			ns.print("Debug: Target Changed");
			let hasFormulasFlag = await hasFormulas(ns);
			await ns.sleep(100);


			//Debug != to test early scripts once you have formulas. == for prod.
			if (hasFormulasFlag == false) {
				let target = currTargets[0];
				const validHosts = ns.read("/data/validhosts.txt").split(",");
				//This can be made more efficient with a read, but both these scripts run on home anyway.
				const pHosts = ns.getPurchasedServers();
				let secThresh = ns.getServerMinSecurityLevel(target) + 5;
				let monThresh = ns.getServerMaxMoney(target) * 0.75;
				let allHosts = [];
				if (pHosts.length > 0) {
					allHosts = validHosts.concat( pHosts);
				}
				else {
					allHosts = validHosts;
				}
				for (const host of allHosts) {
					ns.scp("/scripts/shared/hgw/remotehack.js", host);
					ns.killall(host);
					await ns.sleep(100);
					let threads = (Math.floor(ns.getServerMaxRam(host) / ns.getScriptRam("/scripts/shared/hgw/remotehack.js", host)));
					await ns.sleep(100);

					ns.exec("/scripts/shared/hgw/remotehack.js", host, threads, target, secThresh, monThresh);
				}
				ns.print("Target updated across all hosts, sleeping for 5 minutes.")

			}
			//DEBUG switch to == for prod
			else if (hasFormulasFlag == true) {

				ns.tprint("Time to Switch to batchers buddy!");
				batcherTime = true;
				return;

			}
			else {
				ns.print("DEBUG: The formulas flag messed up again.")
				return;
			}
			await ns.sleep(5 * 60000);

		} else {
			//Sleep for 5 minutes if target has not changed.
			ns.print("No new target, sleeping for 5 minutes.")
			await ns.sleep(5 * 60000);
		}
	}
}