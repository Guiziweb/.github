# {BundleClass}

{description}

## Requirements

- PHP ^8.2
- Sylius ^2.0

## Installation

Add the Flex endpoint to your `composer.json`:

```json
{
    "extra": {
        "symfony": {
            "endpoint": [
                "https://api.github.com/repos/Guiziweb/SyliusRecipes/contents/index.json?ref=flex/main",
                "flex://defaults"
            ]
        }
    }
}
```

Then:

```bash
composer require {package}
```

## Development

```bash
cp compose.override.dist.yml compose.override.yml
ENV=dev make init
ENV=dev make database-init
ENV=dev make load-fixtures
```

## License

MIT
