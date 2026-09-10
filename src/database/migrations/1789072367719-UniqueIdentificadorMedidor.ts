import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueIdentificadorMedidor1789072367719 implements MigrationInterface {
    name = 'UniqueIdentificadorMedidor1789072367719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`medidores\` ADD UNIQUE INDEX \`IDX_fbe3e2388480ba3dd29cd5d7e1\` (\`identificador\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`medidores\` DROP INDEX \`IDX_fbe3e2388480ba3dd29cd5d7e1\``);
    }

}
