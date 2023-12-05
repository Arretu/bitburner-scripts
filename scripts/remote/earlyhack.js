/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]

	while(true){

		if(ns.getServerMinSecurityLevel(target) < ns.getServerSecurityLevel(target)) {
			await ns.weaken(target);
		}
		else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
			await ns.grow(target);
		}
		else{
			await ns.hack(target);
		}
		await ns.sleep(50);
	}

}