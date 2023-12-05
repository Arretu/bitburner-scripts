/** @param {NS} ns */
export async function main(ns) {
	const targetUpdatePort = ns.getPortHandle(1);
	while (true) {
		const hasFormulas = ns.fileExists("Formulas.exe", "home");
		let targetList;
		let oldTargetList;
		if (hasFormulas == false) {
			ns.print("No Formulas")
			targetList = tScan(ns);
			await ns.sleep(100);
		}
		else if (hasFormulas == true) {
			ns.print("Has Formulas.")
			targetList = formScan(ns);
			await ns.sleep(100);
		}
		if (ns.fileExists("/data/targetList.txt", "home")) {
			oldTargetList = ns.read("/data/targetList.txt");
		}
		if (oldTargetList == targetList) {
			ns.print("No target changes.");
		}
		else {
			ns.print("Target changes detected.");
			//targetUpdatePort.clear()
			//targetUpdatePort.write(targetList[0]);
		}
		ns.write("/data/targetList.txt", targetList.toString(), "w");
		ns.print("Cycle complete. Sleeping 5 minutes.");
		await ns.sleep(5 * 60000)
	}
}
/** @param {NS} ns */
export function tScan(ns) {
	const potentialTargets = ns.read("/data/static/potentialTargets.txt").split(",");
	const scoredTargets = [];
	const targetList = [];
	let pHack = ns.getHackingLevel();
	//ns.print("DEBUG ", potentialTargets.toString())
	for (const target of potentialTargets) {
		if (pHack / 3 > ns.getServerRequiredHackingLevel(target)) {
			if (ns.hasRootAccess(target) == true) {
				let score = ns.getServerMaxMoney(target) / ns.getServerMinSecurityLevel(target);
				scoredTargets.push([target, score]);
			}
		}
	}
	scoredTargets.sort(function (a, b) { return b[1] - a[1]; });
	for (const sTarget of scoredTargets) {
		//ns.tprint("DEBUG: ", sTarget.toString())
		targetList.push(sTarget[0]);
	}
	return targetList;
}
/** @param {NS} ns */
export function formScan(ns) {
	const potentialTargets = ns.read("/data/static/potentialTargets.txt").split(",");
	const player = ns.getPlayer();
	const targetList = [];
	//ns.tprint(potentialTargets.toString())
	const scoredTargets = [];
	for (const ptarget of potentialTargets) {
		const vTarget = ns.getServer(ptarget);
		vTarget.hackDifficulty = vTarget.minDifficulty;
		let vChance = ns.formulas.hacking.hackChance(vTarget, player);
		if (vChance > 0.9) {
			let score = (vTarget.moneyMax / ns.formulas.hacking.weakenTime(vTarget, player)) * vChance;
			scoredTargets.push([ptarget, score])
		}
	}
	scoredTargets.sort(function (a, b) { return b[1] - a[1]; });
	for (const sTarget of scoredTargets) {
		targetList.push(sTarget[0]);
	}
	return targetList;
}