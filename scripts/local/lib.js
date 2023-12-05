/** @param {NS} ns */
export async function tPrep(ns, pHosts, target, minRam) {
	let sumHostRam = 0
	for (const pHost of pHosts) {
		let hostRam = ns.getServerMaxRam(pHost)
		sumHostRam = sumHostRam + hostRam
	}
	ns.print("tPrep - target is " + target + " with " + sumHostRam + "GB RAM on " + pHosts.length + " hosts.")
	while (true) {
		let pid
		let mode
		const currSec = ns.getServerSecurityLevel(target)
		const minSec = ns.getServerMinSecurityLevel(target)
		const maxCash = ns.getServerMaxMoney(target)
		const currCash = ns.getServerMoneyAvailable(target)
		const wStrength = ns.weakenAnalyze(1);
		const gDelay = 0.8 * ns.getHackTime(target)
		if (currSec - minSec > 0) {
			mode = "w"
			ns.print(target + " needs Weaken.")
		}
		else if (maxCash - currCash > 0) {
			mode = "gw"
			ns.print(target + " needs Grow.")
		}
		else {
			ns.print(target + " is prepped.")
			return true;
		}
		let nBatches, batchRam, gThreads, wThreads

		if (mode == "w") {
			nBatches = Math.ceil((currSec - minSec) / wStrength)
			batchRam = 1.75
		}
		else if (mode == "gw") {
			if (!formFlag(ns)) {
				ns.print("tPrep - No Formulas")
				gThreads = 8
				wThreads = 1
				let gMultNeeded = ((maxCash - currCash) / currCash) * 100
				nBatches = Math.ceil((1.05 * ns.growthAnalyze(target, gMultNeeded, 1) / gThreads))
			}
			else if (formFlag(ns)) {
				ns.print("tPrep - Formulas")
				const vTarget = ns.getServer(target)
				const player = ns.getPlayer()
				let ngThreads = Math.ceil(ns.formulas.hacking.growThreads(vTarget, player, vTarget.moneyMax))
				let goalPerc = 1

				gThreads = Math.ceil(goalPerc * ngThreads)
				wThreads = Math.ceil((gThreads * 0.004) / 0.05)
				let bram = (gThreads + wThreads) * 1.75
				if (bram <= minRam) {
					ns.print("Batch fits G/W:" + gThreads + " / " + wThreads)
					batchFits = true
				}
				else {
					let ratio = minRam / bram
					gThreads = Math.floor(gThreads * ratio)
					wThreads = Math.ceil(wThreads * ratio)
				}
				nBatches = Math.ceil(ngThreads / gThreads)
			}
			batchRam = (gThreads + wThreads) * 1.75
		}
		ns.print("Starting prep batches.")
		let tPosBatches = 0;
		for (const pHost of pHosts) {
			let hostBatches = Math.floor(ns.getServerMaxRam(pHost) / batchRam)
			tPosBatches = tPosBatches + hostBatches
		}
		if (nBatches > tPosBatches) {
			ns.print("Need more batches than supported by RAM. Capping batches.")
			nBatches = tPosBatches
		}
		let pidArr = []
		let launchedBatches = 0
		let lastHost
		for (const pHost of pHosts) {
			if (launchedBatches < nBatches) {
				let hostThreads = Math.floor((ns.getServerMaxRam(pHost) - ns.getServerUsedRam(pHost)) / batchRam);
				if (hostThreads + launchedBatches > nBatches) {
					ns.print("Nearing cap, adjusting hostTHreads")
					let hostThreads1 = nBatches - launchedBatches + 10;
					if (hostThreads > hostThreads1) {
						hostThreads = hostThreads1;
					}
				}
				if (hostThreads > 0) {
					if (mode == "w") {
						pid = prepW(ns, pHost, hostThreads, target)
						pidArr.push(pid)
						launchedBatches = launchedBatches + hostThreads
						lastHost = pHost
					}
					else if (mode == "gw") {
						for (let i = 0; i < hostThreads; i++) {
							pid = prepGW(ns, pHost, gDelay, gThreads, wThreads, target)
							pidArr.push(pid)
							launchedBatches++
							lastHost = pHost
						}
					}
				}
				else { launchedBatches = nBatches }
			}
		}
		let waitPID = pidArr.pop()
		ns.print("Tasks fired. Waiting for " + waitPID + " on " + lastHost + ".")
		while (ns.isRunning(waitPID, lastHost)) await ns.sleep(500);
		ns.print(waitPID + " ended.")
	}
}
/** @param {NS} ns */
export function execHGW(ns, pHost, hDelay, hThreads, gDelay, gThreads, wThreads, target) {
	ns.exec("/scripts/remote/hack.js", pHost, hThreads, hDelay, target)
	ns.exec("/scripts/remote/grow.js", pHost, gThreads, gDelay, target)
	let pid = ns.exec("/scripts/remote/weaken.js", pHost, wThreads, 0, target)
	return pid;
}
/** @param {NS} ns */
export function prepGW(ns, pHost, gDelay, gThreads, wThreads, target) {
	ns.exec("/scripts/remote/grow.js", pHost, gThreads, gDelay, target)
	let pid = ns.exec("/scripts/remote/weaken.js", pHost, wThreads, 0, target)
	return pid;
}
/** @param {NS} ns */
export function prepW(ns, pHost, wThreads, target) {
	let pid = ns.exec("/scripts/remote/weaken.js", pHost, wThreads, 0, target)
	return pid;
}
/** @param {NS} ns */
export function formFlag(ns) {
	const formFlag = ns.fileExists("Formulas.exe", "home");
	return formFlag;
}
/** @param {NS} ns */
export function hostPrep(ns, pHosts) {
	const fileList = ns.ls("home", "/scripts/remote");
	for (const host of pHosts) {
		for (const file of fileList) {
			ns.scp(file, host, "home")
		}
	}
}
/** @param {NS} ns */
export function batchArgsF(ns, target, minRAM) {
	let hThreads, gThreads, wThreads, bRam;
	const vTarget = ns.getServer(target);
	const player = ns.getPlayer();
	const wStrength = ns.weakenAnalyze(1);
	let goalPerc = 0.1;
	//Work out hThreads
	vTarget.moneyAvailable = vTarget.moneyMax
	vTarget.hackDifficulty = vTarget.minDifficulty;
	hThreads = Math.floor(goalPerc / ns.formulas.hacking.hackPercent(vTarget, player));
	//Work out gThreads
	let hSecGain = hThreads * 0.002;
	const realHackPerc = hThreads * ns.formulas.hacking.hackPercent(vTarget, player)
	vTarget.moneyAvailable = vTarget.moneyMax * (1 - realHackPerc);
	vTarget.hackDifficulty = vTarget.minDifficulty + hSecGain;
	gThreads = Math.ceil(ns.formulas.hacking.growThreads(vTarget, player, vTarget.moneyMax));
	//Work out wThreads.
	let gSecGain = gThreads * 0.004;
	let tSecGain = hSecGain + gSecGain;
	wThreads = Math.ceil(1.01 * (tSecGain / wStrength));
	bRam = ((wThreads + gThreads) * 1.75) + (1.7 * hThreads);
	if(bRam > minRAM) {
		let ratio = minRAM/bRam
		hThreads = Math.floor(hThreads*ratio)
		gThreads = Math.floor(gThreads*ratio)
		wThreads = Math.ceil(wThreads*ratio)
	}
return [hThreads, gThreads, wThreads, bRam];
}
/** @param {NS} ns */
export function batchArgs(ns, target, minRam) {
	//Assume target is prepped, yo.
	let goalPerc = 0.15
	let bRam = 0
	let hThreads, gThreads, wThreads
	let maxCash = ns.getServerMaxMoney(target)
	let perHackThread = ns.hackAnalyze(target)
	while (bRam > minRam || bRam == 0) {
		ns.print("Goal perc:" + (100 * goalPerc) + "%")
		hThreads = Math.floor(goalPerc / perHackThread)
		let hSecGain = hThreads * 0.002
		let vgMult = (maxCash / (maxCash - (maxCash * goalPerc)))
		gThreads = Math.ceil(ns.growthAnalyze(target, vgMult) * 1.01)
		let gSecGain = gThreads * 0.004
		let tSecGain = gSecGain + hSecGain
		wThreads = Math.ceil((tSecGain / 0.05) * 1.05)
		bRam = ((wThreads + gThreads) * 1.75) + (hThreads * 1.7)
		if (bRam > minRam) {
			ns.print("bRAM: " + bRam + " > minRAM: " + minRam)
			if (goalPerc > 0.005) {
				goalPerc = goalPerc - 0.005
			}
			else { ns.print("BatchGen failed."); return }
		}
	}
	return [hThreads, gThreads, wThreads, bRam]
}
/** @param {NS} ns */
export function getHosts(ns) {
	const pHosts = ns.getPurchasedServers();
	const npcHosts = ns.read("/data/rootedHosts.txt").split(",")
	const sortHosts = [];
	const mUseRam = minUsefulRam(ns)
	ns.tprint("min useful RAM = " + mUseRam)
	for (const nHost of npcHosts) {
		let nHostRam = ns.getServerMaxRam(nHost)
		if (nHostRam >= mUseRam) {
			sortHosts.push([nHost, nHostRam])
		}
	}
	sortHosts.sort(function (a, b) { return b[1] - a[1]; })
	const snHosts = []
	for (const sHost of sortHosts) {
		snHosts.push(sHost[0].toString())
	}
	//ns.tprint("snHosts: "+snHosts+"\n"+"\n")
	if (pHosts.length > 0) {
		ns.print("Adding pHosts")
		const vHosts = pHosts.concat(snHosts)
		//ns.tprint(vHosts)
		return vHosts
	}
	else {
		return snHosts
	}
}
export function getMinRam(ns, pHosts) {
	let minRam = 999999999999999
	for (const pHost of pHosts) {
		let pHostRam = ns.getServerMaxRam(pHost)
		if (pHostRam < minRam) {
			minRam = pHostRam
		}
	}
	return minRam;
}
/** @param {NS} ns */
export function minUsefulRam(ns) {
	const allServers = ns.read("/data/static/npcHosts.txt").split(",")
	const pHosts = ns.getPurchasedServers();
	let tpRam = 0
	if (pHosts.length > 0) {
		tpRam = pHosts.length * ns.getServerMaxRam(pHosts[0])
	}
	const ramArr = []
	let added = 0;
	let tnRam = 0
	while (added < allServers.length)
		for (const server of allServers) {
			let servRam = ns.getServerMaxRam(server)
			if (servRam > 0) {
				ramArr.push([server, servRam])
				tnRam = tnRam + servRam
			}
			added++
		}
	const allRAM = tpRam + tnRam
	ramArr.sort(function (a, b) { return b[1] - a[1]; })
	const ramAmounts = []
	let prevRam = 0;
	for (const server of ramArr) {
		let ram = server[1];
		if (ram != prevRam) {
			ramAmounts.push(ram)
		}
		prevRam = ram
	}
	let minUseRam = 0;
	for (const ramVal of ramAmounts) {
		let count = 0
		for (const server of ramArr) {
			if (server[1] == ramVal) {
				count++
			}
		}
		let percOfRam = ((count * ramVal) / allRAM) * 100
		if (percOfRam > 0.05) {
			minUseRam = ramVal
		}
	}
	return minUseRam
}