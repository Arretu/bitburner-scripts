/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep');
	ns.tail();

	while (true) {
		const pHosts = ns.getPurchasedServers();
		const currCash = ns.getServerMoneyAvailable("home");
		let tRAMpower = 20;
		let currRAM = 0;
		let bestFound = false;
		if (pHosts.length > 0) {
			currRAM = ns.getServerMaxRam(pHosts[0]);
		}
		if (currRAM == 2 ** 20) {
			ns.print("Server capacity capped. Ending task.");
			return;
		}
		while (bestFound == false) {
			let neededCash = ns.getPurchasedServerCost(2 ** tRAMpower) * 25
			if (neededCash <= currCash) {
				ns.print("Can afford" + (2 ** tRAMpower) + "GB of RAM on 25 hosts.");
				bestFound = true;
			}
			else {
				if (tRAMpower > 2) {
					ns.print("cannot afford ", 2 ** tRAMpower, " RAM.")
					tRAMpower = tRAMpower - 2;
				}
				else {
					ns.print("Cant afford any servers you scrub.");
				}
			}
			await ns.sleep(20);
		}

		let newRAM = 2 ** tRAMpower;
		ns.print("Can afford " + newRAM + " GB RAM per server.")

		if (newRAM > currRAM) {
			ns.print("New ram > old ram, upgrading.")
			if (pHosts.length > 0) {
				for (const host of pHosts) {
					ns.killall(host);
					ns.deleteServer(host);
				}
			}
			for (let i = 0; i < 25; i++) {
				ns.purchaseServer("node-" + i, newRAM);
			}
		}
		else {
			ns.print("New ram (" + newRAM + ") is less than old RAM (" + currRAM + "). Waiting 15 minutes.");
		}
		await ns.sleep(60000 * 15);
	}
}