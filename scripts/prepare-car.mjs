import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { mkdir } from 'node:fs/promises';

// Retain the authored car geometry, replacing large demo textures with studio materials.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const document = await io.read(process.argv[2]);
for (const extension of document.getRoot().listExtensionsUsed()) extension.dispose();
for (const texture of document.getRoot().listTextures()) texture.dispose();
for (const material of document.getRoot().listMaterials()) {
  const name = material.getName();
  if (!/Headlight|Brakelight|Signallight/.test(name)) material.setEmissiveFactor([0, 0, 0]);
  material.setMetallicFactor(.5).setRoughnessFactor(.3);
  if (/Paint/.test(name)) material.setBaseColorFactor([.12, .14, .15, 1]).setMetallicFactor(.85).setRoughnessFactor(.23);
  if (/Glass/.test(name)) material.setBaseColorFactor([.045, .065, .075, 1]).setAlphaMode('OPAQUE').setRoughnessFactor(.12);
  if (/Interior|Mechanical|Tire|Panel|Floormat|License/.test(name)) material.setBaseColorFactor([.025, .028, .03, 1]).setRoughnessFactor(.65).setMetallicFactor(.1);
  if (/Rim/.test(name)) material.setBaseColorFactor([.55, .48, .32, 1]).setMetallicFactor(.95);
}
// Remove the source's trademark-bearing plates/emblem; no branding is carried over.
for (const node of document.getRoot().listNodes()) {
  if (/License Plate|InteriorSteeringEmblem/.test(node.getName())) node.dispose();
}
await MeshoptEncoder.ready;
await document.transform(prune(), dedup(), weld(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await mkdir('public/models', { recursive: true });
await io.write('public/models/detailing-car.glb', document);
console.log('Optimized car written to public/models/detailing-car.glb');
