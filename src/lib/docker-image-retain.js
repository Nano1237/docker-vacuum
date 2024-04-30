const { dockerImages } = require('./docker-images');
const { dockerRmi } = require('./docker-rmi');

const findDistinctImages = (lines) => {
  const images = [];

  lines.forEach((line) => {
    if (!images.includes(line.repository)) {
      images.push(line.repository);
    }
  });

  return images;
};

const matchRules = (rules, repositories) => {
  const results = [];
  console.log(rules);
  rules.forEach((rule) => {
    const regexp = new RegExp(rule.match);

    repositories.forEach((line) => {
      if (line.match(regexp)) {
        results.push({
          repository: line,
          retain: rule.retain,
        });
      }
    });
  });

  return results;
};

const mergeRules = (matches, images) =>
  matches
    .map((match) => ({
      ...match,
      images: images.filter((image) => image.repository === match.repository),
    }))
    .filter((rule) => rule.images.length > rule.retain);

const getUnretainedImages = (images, retain = 1) => {
  const ids = [];
  const unique = images.filter((image) => {
    if (!ids.includes(image.uuid)) {
      ids.push(image.uuid);
      return true;
    }
  });

  unique.sort((a, b) => b.ctime.date - a.ctime.date);

  for (let i = 0; i < retain; i++) {
    unique.shift();
  }

  return unique;
};

const getObsoleteImages = (images, rules) => {
  const repositories = findDistinctImages(images);
  const matches = matchRules(rules, repositories);
  const targets = mergeRules(matches, images);

  return targets.reduce((acc, curr) => {
    return [...acc, ...getUnretainedImages(curr.images, curr.retain)];
  }, []);
};

const dockerImageRetain = async (rules, keep = []) => {
  const allImages = await dockerImages();
  const danglingImages = allImages.filter(
    (image) => !keep.includes(image.uuid),
  );

  const obsoleteImages = getObsoleteImages(danglingImages, rules);

  const res = {
    state: {
      allImages,
      danglingImages,
      obsoleteImages,
    },
    deleted: [],
    errors: [],
  };

  for (const image of obsoleteImages) {
    try {
      const output = await dockerRmi(image.uuid);
      res.deleted.push({
        image,
        output,
      });
    } catch (error) {
      res.errors.push({
        image,
        message: error.message,
      });
    }
  }

  return res;
};

module.exports = {
  findDistinctImages,
  matchRules,
  mergeRules,
  getUnretainedImages,
  getObsoleteImages,
  dockerImageRetain,
};
