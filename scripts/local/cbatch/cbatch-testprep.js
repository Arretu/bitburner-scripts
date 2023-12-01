/** @param {NS} ns */
export async function main(ns) {

	const target = ns.args[0]
	const pHost = "node-0"
	ns.killall(pHost);
	const player = ns.getPlayer()

	let prepDone = false;
	let pid;

	while (prepDone == false) {
		let prepTarg = ns.getServer(target);
		let cashDelta = prepTarg.moneyMax - prepTarg.moneyAvailable;
		let secDelta = prepTarg.hackDifficulty - prepTarg.minDifficulty;

		ns.tprint(cashDelta, " | ", secDelta);
		

		if (cashDelta > 0) {
			ns.tprint(target, " requires growing.");
			let pgThreads = Math.ceil(1.01 * ns.formulas.hacking.growThreads(prepTarg, player, prepTarg.moneyMax, 1));
			let gSecGain = pgThreads * 0.004;
			let tSecDelta = secDelta + gSecGain;
			let pwThreads = Math.ceil(1.01 * (tSecDelta / 0.05));
			let pwTime = ns.formulas.hacking.weakenTime(prepTarg, player);
			let pgTime = ns.formulas.hacking.growTime(prepTarg, player);

			ns.exec("/scripts/remote/grow.js", pHost, pgThreads, pwTime - pgTime - 50, target)
			pid = ns.exec("/scripts/remote/weaken.js", pHost, pwThreads, 0, target)
			while (ns.isRunning(pid, pHost)) await ns.sleep(100);
		}
		else if (secDelta > 0) {
			ns.tprint(target, " requires weakening. secDelta: ", secDelta)
			let pwThreads = Math.ceil(secDelta / 0.05);

			pid = ns.exec("/scripts/remote/weaken.js", pHost, pwThreads, 0, target)
			while (ns.isRunning(pid, pHost)) await ns.sleep(100);
		}
		else { prepDone = true; ns.tprint("Prep complete");await ns.sleep(100) }
	}

}