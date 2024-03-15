# dmr.is

Monorepo DMR

## Dependencies

TODO

## Git submodules

Submodules are configured with [.envrc.git](./.envrc.git) by adding [post-checkout](https://git-scm.com/docs/githooks#_post_checkout) and [post-merge](https://git-scm.com/docs/githooks#_post_merge) hooks to the repository. This means that after cloning the repository, the submodules are automatically initialized and updated.

The `.envrc` script will create/override the following files:

```bash
.git/hooks/post-checkout
.git/hooks/post-merge
```

To pin a submodule to a specific commit or the paths that should be checked out, update the `sha` property in the [submodules/config.json](./submodules/config.json) file.

To play around with the automation script you can modify the the config file and run the script manually:

```bash

{
  "submodules": [
    {
      "name": "island.is",
      "sha": "HEAD~5", # some commit sha
      "sparseCheckoutPaths": [
        "libs/shared"
      ]
    }
  ]
}

./.gitscripts/checkout-submodules.sh
```
