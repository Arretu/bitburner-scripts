/** @param {NS} ns */
export async function earlyTarget(ns,mode) {

	//let mode = ns.args[1];
	let currTargets = [];
	let best5 = [];

	// List of rooted, hackable servers.
	const possibleTargets = ns.read("/data/possibletargets.txt").split(",");


	//This is really bad and doesn't work well.
	for (const target of possibleTargets) {
		if ((playerHackLevel / 3) > ns.getServerRequiredHackingLevel(target)) {

			//score target and add to new array
			const thisTarget = [target, Math.floor(ns.getServerMaxMoney(target) / ns.getWeakenTime(target))];
			//ns.tprint("DEBUG thistarget: ", thisTarget.toString());
			currTargets.push(thisTarget);
		}
	}

	currTargets.sort(function (a, b) { return b[1] - a[1]; });

	for (i = 0; i <= 3; i++) {
		best5.push(currTargets([i][0]));
	}
	if (mode == "w") {
		ns.mv("home", "/data/currtargets.txt", "/data/old/currtargets.txt");
		await ns.sleep(500);
		ns.write("/data/currtargets.txt", best5.toString());
		return best5;
	}	else {
		return best5;
	}
}