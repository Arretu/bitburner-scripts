/** @param {NS} ns */
export async function main(ns) {

	let target = ns.args[1];
	let mode = ns.args[0];
	const hosts = [];
	const rootedHosts = ns.read("/scripts/rootedservers.txt").split(",");
	const personalHosts = ns.read("/scripts/ownservers.txt").split(",");
	const allHosts = rootedHosts.concat(personalHosts);
	const home = ["home"];
	let SecThresh = ns.getServerMinSecurityLevel(target) + 5;
	let MonThresh = ns.getServerMaxMoney(target) * 0.75;
	let HostSet;

	if (mode == "-p") {
		HostSet = allHosts;
	}
	else if (mode == "-r") {
		HostSet = rootedHosts;
	}
	else if (mode == "-a") {
		HostSet = allHosts;
	}
	else if (mode == "-h") {
		HostSet = home;
	}
	else {
		ns.tprint("Please select a mode -p personal servers -r rooted servers -a all servers");
		return;
	}


	for (const host of HostSet) {

		//Copy hack to host and kill all scripts
		ns.scp("/shared/remotehack.js", host);
		ns.killall(host);

		//Find Ram of host and script ram cost.
		let maxRam = ns.getServerMaxRam(host);
		let scriptRam = ns.getScriptRam("/shared/remotehack.js", host);

		if (maxRam > 0) {
			let threads = 0;
			if (host == "home") {
				threads = parseInt((maxRam - 1000) / scriptRam);
			}
			else {
				threads = parseInt(maxRam / scriptRam);
			}

			ns.exec("/shared/remotehack.js", host, threads, target, SecThresh, MonThresh);

		}

	}
}




