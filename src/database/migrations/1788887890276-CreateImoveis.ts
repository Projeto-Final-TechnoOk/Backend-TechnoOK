import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImoveis1788887890276 implements MigrationInterface {
  name = 'CreateImoveis1788887890276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`imoveis\` (\`id\` varchar(36) NOT NULL, \`nome\` varchar(255) NOT NULL, \`endereco\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`imoveis\``);
  }
}
