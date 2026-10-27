/**
 * Unit tests for the preview's pose logic (spec: kalman-preview, "A rotation slider per
 * layer", "Copy pose", "Kálmán is shown with a description").
 */
import { describe, expect, it } from 'vitest';
import { validatePose, type Pose } from '../../src/lib/kalman-rig';
import { figureDescription, poseFromControls, poseToJson } from '../../src/lib/preview-pose';
import { REPO_RIG } from '../../src/scene/kalman/repo-rig';

const BOW: Pose = {
  name: 'bow',
  label: 'Bow',
  layers: { head: { offset: [0, 70] }, flipperLeft: { rotate: -6 } },
};

describe('poseFromControls', () => {
  it('keeps the named pose when the sliders match it', () => {
    expect(poseFromControls(BOW, { head: 0, flipperLeft: -6, tail: 0 })).toEqual(BOW);
  });

  it('becomes a custom pose once a slider differs, keeping the offsets', () => {
    expect(poseFromControls(BOW, { head: 12, flipperLeft: -6 })).toEqual({
      name: 'custom',
      label: 'Custom',
      layers: { head: { rotate: 12, offset: [0, 70] }, flipperLeft: { rotate: -6 } },
    });
  });

  it('leaves out layers at rest, so the JSON stays short', () => {
    const rest: Pose = { name: 'rest', label: 'Rest', layers: {} };
    expect(poseFromControls(rest, { head: 0, tail: 5 }).layers).toEqual({ tail: { rotate: 5 } });
  });
});

describe('poseToJson', () => {
  it('gives JSON that passes pose validation for the repo rig', () => {
    const json = poseToJson(poseFromControls(BOW, { head: 10, tail: -20 }));
    const result = validatePose(JSON.parse(json), REPO_RIG);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });
});

describe('figureDescription', () => {
  it('names the pose and the mood', () => {
    expect(figureDescription(BOW, 'professional')).toBe('Kálmán, pose: Bow, mood: professional');
  });
});
