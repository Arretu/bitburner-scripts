/** @param {NS} ns */
import { getPenPower, getPenTools } from '/shared/lib.js';

/** @param {NS} ns */
export async function main(ns) {

	ns.disableLog("getServerNumPortsRequired");


	const allServers = ns.read("/data/static/allnpc.txt").split(",");
	let finished = false;




	while (finished == false) {
		const rootedServers = ns.read("/data/allrooted.txt").split(",");
		const tools = getPenTools(ns);

		//DEBUG
		ns.print("DEBUG: Tools available: ", tools.toString());


		let penPower = getPenPower(ns);

		//DEBUG
		ns.print("DEBUG: penpower is ", penPower);


		//Debug remove -10 for production
		//Check to see if we have rooted all servers
		if (rootedServers.length < allServers.length) {

			//DEBUG
			ns.print('DEBUG: ', allServers.length - rootedServers.length, " servers remaining");

			for (const target of allServers) {

				//Check if server is rooted.
				if (rootedServers.indexOf(target) === -1) {
					if (ns.hasRootAccess(target) == false) {

						//Debug
						ns.print("DEBUG: ", target);

						let penDef = ns.getServerNumPortsRequired(target);
						if (penPower >= penDef) {
							//const tools = getPenTools(ns);
							if (tools.indexOf('ssh') != -1) {
								ns.brutessh(target);
							}
							if (tools.indexOf('ftp') != -1) {
								ns.ftpcrack(target);
							}
							if (tools.indexOf('smtp') != -1) {
								ns.relaysmtp(target);
							}
							if (tools.indexOf('http') != -1) {
								ns.httpworm(target);
							}
							if (tools.indexOf('sql') != -1) {
								ns.sqlinject(target);
							}
							ns.nuke(target);
							rootedServers.push(target);
							ns.tprint(target, " has been rooted.")

						}
					}
				}
			}
			ns.print("No nukes possible. Sleeping for 2 minutes.")
			await ns.sleep(120000)
		}

		else {
			finished = true;
		}


	}
	ns.tprint("XXXXXxxxxx All Servers Rooted. xxxxxxXXXXX");


}
